import type { AllSettings } from '@server/lib/settings';
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = (settings: AllSettings): AllSettings => {
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .map((file) => require(path.join(migrationsDir, file)).default);

  let migrated = settings;

  for (const migration of migrations) {
    migrated = migration(migrated);
  }

  return migrated;
};
