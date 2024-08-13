import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = async (
  settings: AllSettings
): Promise<AllSettings> => {
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .map((file) => require(path.join(migrationsDir, file)).default);

  let migrated = settings;

  try {
    for (const migration of migrations) {
      migrated = await migration(migrated);
    }
  } catch (e) {
    logger.error(
      `Something went wrong while running settings migrations: ${e.message}`,
      { label: 'Settings Migrator' }
    );
  }

  return migrated;
};
