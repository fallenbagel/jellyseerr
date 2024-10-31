import type { ProxySettings } from '@server/lib/settings';
import logger from '@server/logger';
import type { Dispatcher } from 'undici';
import { Agent, ProxyAgent, setGlobalDispatcher } from 'undici';

export default async function createCustomProxyAgent(
  proxySettings: ProxySettings
) {
  const defaultAgent = new Agent();

  const skipUrl = (url: string) => {
    const hostname = new URL(url).hostname;

    if (proxySettings.bypassLocalAddresses && isLocalAddress(hostname)) {
      return true;
    }

    for (const address of proxySettings.bypassFilter.split(',')) {
      const trimmedAddress = address.trim();
      if (!trimmedAddress) {
        continue;
      }

      if (trimmedAddress.startsWith('*')) {
        const domain = trimmedAddress.slice(1);
        if (hostname.endsWith(domain)) {
          return true;
        }
      } else if (hostname === trimmedAddress) {
        return true;
      }
    }

    return false;
  };

  const noProxyInterceptor = (
    dispatch: Dispatcher['dispatch']
  ): Dispatcher['dispatch'] => {
    return (opts, handler) => {
      const url = opts.origin?.toString();
      return url && skipUrl(url)
        ? defaultAgent.dispatch(opts, handler)
        : dispatch(opts, handler);
    };
  };

  const token =
    proxySettings.user && proxySettings.password
      ? `Basic ${Buffer.from(
          `${proxySettings.user}:${proxySettings.password}`
        ).toString('base64')}`
      : undefined;

  try {
    const proxyAgent = new ProxyAgent({
      uri:
        (proxySettings.useSsl ? 'https://' : 'http://') +
        proxySettings.hostname +
        ':' +
        proxySettings.port,
      token,
      interceptors: {
        Client: [noProxyInterceptor],
      },
    });

    setGlobalDispatcher(proxyAgent);
  } catch (e) {
    logger.error('Failed to connect to the proxy: ' + e.message, {
      label: 'Proxy',
    });
    setGlobalDispatcher(defaultAgent);
    return;
  }

  try {
    const res = await fetch('https://www.google.com', { method: 'HEAD' });
    if (res.ok) {
      logger.debug('HTTP(S) proxy connected successfully', { label: 'Proxy' });
    } else {
      logger.error('Proxy responded, but with a non-OK status: ' + res.status, {
        label: 'Proxy',
      });
      setGlobalDispatcher(defaultAgent);
    }
  } catch (e) {
    logger.error(
      'Failed to connect to the proxy: ' + e.message + ': ' + e.cause,
      { label: 'Proxy' }
    );
    setGlobalDispatcher(defaultAgent);
  }
}

function isLocalAddress(hostname: string) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  const privateIpRanges = [
    /^10\./, // 10.x.x.x
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.x.x - 172.31.x.x
    /^192\.168\./, // 192.168.x.x
  ];
  if (privateIpRanges.some((regex) => regex.test(hostname))) {
    return true;
  }

  return false;
}
