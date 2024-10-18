/* eslint-disable no-console */
import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = async (
  settings: AllSettings,
  SETTINGS_PATH: string
): Promise<AllSettings> => {
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .map((file) => require(path.join(migrationsDir, file)).default);

  let migrated = settings;

  try {
    const settingsBefore = JSON.stringify(migrated);

    for (const migration of migrations) {
      migrated = await migration(migrated);
    }

    const settingsAfter = JSON.stringify(migrated);

    if (settingsBefore !== settingsAfter) {
      // a migration occured
      // we check that the new config will be saved
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(migrated, undefined, ' '));
      const fileSaved = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      if (JSON.stringify(fileSaved) !== settingsAfter) {
        // something went wrong while saving file
        throw new Error('Unable to save settings after migration.');
      }
    }
  } catch (e) {
    logger.error(
      `Something went wrong while running settings migrations: ${e.message}`,
      { label: 'Settings Migrator' }
    );
    // we stop jellyseerr if the migration failed
    console.log(
      '===================================================================='
    );
    console.log(
      '       SOMETHING WENT WRONG WHILE RUNNING SETTINGS MIGRATIONS       '
    );
    console.log(
      '   Please check that your configuration folder is properly set up   '
    );
    console.log(
      '===================================================================='
    );
    process.exit();
  }

  return migrated;
};
