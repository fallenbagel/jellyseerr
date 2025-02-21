import type { NextPageContext } from 'next/dist/shared/lib/utils';
import type { GetServerSidePropsContext, PreviewData } from 'next/types';
import type { ParsedUrlQuery } from 'querystring';

export const getAuthHeaders = (
  ctx: NextPageContext | GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  return ctx.req && ctx.req.headers
    ? {
        ...(ctx.req.headers.cookie && {
          cookie: ctx.req.headers.cookie,
        }),
        ...(ctx.req.headers['remote-user'] && {
          'remote-user': ctx.req.headers['remote-user'] as string,
        }),
      }
    : undefined;
};
