import type { NextPageContext } from 'next/dist/shared/lib/utils';
import type { GetServerSidePropsContext, PreviewData } from 'next/types';
import type { ParsedUrlQuery } from 'querystring';

export const getRequestHeaders = (
  ctx: NextPageContext | GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  return ctx.req && ctx.req.headers
    ? {
        ...(ctx.req.headers.cookie && {
          cookie: ctx.req.headers.cookie,
        }),
        ...(ctx.req.headers['x-forwarded-user'] && {
          'x-forwarded-user': ctx.req.headers['x-forwarded-user'] as string,
        }),
      }
    : undefined;
};
