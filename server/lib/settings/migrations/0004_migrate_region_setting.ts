import type { AllSettings } from '@server/lib/settings';

const migrateRegionSetting = (settings: any): AllSettings => {
  const oldRegion = settings.main.region;
  if (oldRegion) {
    settings.main.discoverRegion = oldRegion;
    settings.main.streamingRegion = oldRegion;
  } else {
    settings.main.discoverRegion = '';
    settings.main.streamingRegion = 'US';
  }
  delete settings.main.region;

  return settings;
};

export default migrateRegionSetting;
