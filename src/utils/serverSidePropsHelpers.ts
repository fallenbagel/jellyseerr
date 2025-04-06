import { getSettings } from '@server/lib/settings';
import type { NextPageContext } from 'next/dist/shared/lib/utils';
import type { GetServerSidePropsContext, PreviewData } from 'next/types';
import type { ParsedUrlQuery } from 'querystring';

export const getAuthHeaders = (
  ctx: NextPageContext | GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) => {
  const settings = getSettings();
  const userHeader = settings.network.forwardAuth.userHeader;
  const emailHeader = settings.network.forwardAuth.emailHeader ?? '';

  return ctx.req && ctx.req.headers
    ? {
        ...(ctx.req.headers.cookie && {
          cookie: ctx.req.headers.cookie,
        }),
        ...(ctx.req.headers[userHeader] && {
          userHeader: ctx.req.headers[userHeader] as string,
        }),
        ...(emailHeader &&
          emailHeader != '' &&
          ctx.req.headers[emailHeader] && {
            emailHeader: ctx.req.headers[emailHeader] as string,
          }),
        ...(ctx.req.headers['x-forwarded-for'] && {
          'x-forwarded-for': ctx.req.headers['x-forwarded-for'] as string,
        }),
      }
    : undefined;
};
