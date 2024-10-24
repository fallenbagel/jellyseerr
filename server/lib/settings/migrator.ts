/* eslint-disable no-console */
import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';
import fs from 'fs/promises';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = async (
  settings: AllSettings,
  SETTINGS_PATH: string
): Promise<AllSettings> => {
  let migrated = settings;

  try {
    // we read old backup and create a backup of currents settings
    const BACKUP_PATH = SETTINGS_PATH.replace('.json', '.old.json');
    let oldBackup: Buffer | null = null;
    try {
      oldBackup = await fs.readFile(BACKUP_PATH);
    } catch {
      /* empty */
    }
    await fs.writeFile(BACKUP_PATH, JSON.stringify(settings, undefined, ' '));

    const migrations = (await fs.readdir(migrationsDir)).filter(
      (file) => file.endsWith('.js') || file.endsWith('.ts')
    );

    const settingsBefore = JSON.stringify(migrated);

    for (const migration of migrations) {
      try {
        logger.debug(`Checking migration '${migration}'...`, {
          label: 'Settings Migrator',
        });
        const { default: migrationFn } = await import(
          path.join(migrationsDir, migration)
        );
        const newSettings = await migrationFn(migrated);
        if (JSON.stringify(migrated) !== JSON.stringify(newSettings)) {
          logger.debug(`Migration '${migration}' has been applied.`, {
            label: 'Settings Migrator',
          });
        }
        migrated = newSettings;
      } catch (e) {
        logger.error(`Error while running migration '${migration}'`, {
          label: 'Settings Migrator',
        });
        throw e;
      }
    }

    const settingsAfter = JSON.stringify(migrated);

    if (settingsBefore !== settingsAfter) {
      // a migration occured
      // we check that the new config will be saved
      await fs.writeFile(
        SETTINGS_PATH,
        JSON.stringify(migrated, undefined, ' ')
      );
      const fileSaved = JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf-8'));
      if (JSON.stringify(fileSaved) !== settingsAfter) {
        // something went wrong while saving file
        throw new Error('Unable to save settings after migration.');
      }
    } else if (oldBackup) {
      // no migration occured
      // we save the old backup (to avoid settings.json and settings.old.json being the same)
      await fs.writeFile(BACKUP_PATH, oldBackup.toString());
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
