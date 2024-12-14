#/bin/sh
COMMIT_TAG=`git rev-parse HEAD`
docker build --build-arg COMMIT_TAG=${COMMIT_TAG} -t bonswouar/jellyseerr -f Dockerfile . && docker push bonswouar/jellyseerr
