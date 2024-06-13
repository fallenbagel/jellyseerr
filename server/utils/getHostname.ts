import { getSettings } from '@server/lib/settings';

interface HostnameParams {
  useSsl?: boolean;
  ip?: string;
  port?: number;
  urlBase?: string;
}

export const getHostname = (params?: HostnameParams): string => {
  const settings = params ? params : getSettings().jellyfin;

  const { useSsl, ip, port, urlBase } = settings;

  const hostname = `${useSsl ? 'https' : 'http'}://${ip}:${port}${urlBase}`;

  return hostname;
};
