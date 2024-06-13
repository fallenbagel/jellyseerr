import type { AllSettings } from '@server/lib/settings';

const migrateHostname = (settings: any): AllSettings => {
  const oldJellyfinSettings = settings.jellyfin;
  if (oldJellyfinSettings && oldJellyfinSettings.hostname) {
    const { hostname } = oldJellyfinSettings;
    const protocolMatch = hostname.match(/^(https?):\/\//i);
    const useSsl = protocolMatch && protocolMatch[1].toLowerCase() === 'https';
    const remainingUrl = hostname.replace(/^(https?):\/\//i, '');
    const urlMatch = remainingUrl.match(/^([^:]+)(:([0-9]+))?(\/.*)?$/);

    delete oldJellyfinSettings.hostname;
    if (urlMatch) {
      const [, ip, , port, urlBase] = urlMatch;
      settings.jellyfin = {
        ...settings.jellyfin,
        ip,
        port: port || (useSsl ? 443 : 80),
        useSsl,
        urlBase: urlBase ? urlBase.replace(/\/$/, '') : '',
      };
    }
  }
  if (settings.jellyfin && settings.jellyfin.hostname) {
    delete settings.jellyfin.hostname;
  }
  return settings;
};

export default migrateHostname;
