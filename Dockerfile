FROM node:22-alpine AS BUILD_IMAGE

WORKDIR /app

ARG TARGETPLATFORM
ENV TARGETPLATFORM=${TARGETPLATFORM:-linux/amd64}

RUN \
  case "${TARGETPLATFORM}" in \
  'linux/arm64' | 'linux/arm/v7') \
  apk update && \
  apk add --no-cache python3 make g++ gcc libc6-compat bash && \
  npm install --global node-gyp \
  ;; \
  esac

RUN npm install --global pnpm@9

COPY package.json pnpm-lock.yaml postinstall-win.js ./
RUN CYPRESS_INSTALL_BINARY=0 pnpm install --frozen-lockfile

COPY . ./

ARG COMMIT_TAG
ENV COMMIT_TAG=${COMMIT_TAG}

RUN pnpm build

# remove development dependencies
RUN pnpm prune --prod --ignore-scripts

RUN rm -rf src server .next/cache charts gen-docs docs

RUN touch config/DOCKER

RUN echo "{\"commitTag\": \"${COMMIT_TAG}\"}" > committag.json


FROM node:22-alpine

# Metadata for Github Package Registry
LABEL org.opencontainers.image.source="https://github.com/Fallenbagel/jellyseerr"

WORKDIR /app

RUN apk add --no-cache tzdata tini && rm -rf /tmp/*

RUN npm install -g pnpm@9

# copy from build image
COPY --from=BUILD_IMAGE /app ./

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "pnpm", "start" ]

EXPOSE 5055
