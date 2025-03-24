import Database from 'better-sqlite3';
import path from 'path';

try {
    const db = new Database(path.join(process.cwd(), 'config/db/db.sqlite3'));

    // Check if column exists
    const columnExists = db.prepare(`
        SELECT COUNT(*) as count
        FROM pragma_table_info('user')
        WHERE name = 'oidcId'
    `).get().count > 0;

    if (columnExists) {
        console.log('oidcId column already exists in user table');
        db.close();
        process.exit(0);
    }

    // Create backup
    db.backup(path.join(process.cwd(), 'config/db/db.sqlite3.backup'))
        .then(() => {
            console.log('Database backup created');

            // Add the column
            db.exec('ALTER TABLE user ADD COLUMN oidcId VARCHAR;');
            console.log('Added oidcId column to user table');

            db.close();
        })
        .catch((err) => {
            console.error('Backup failed:', err);
            db.close();
            process.exit(1);
        });
} catch (err) {
    console.error('Failed to modify database:', err);
    process.exit(1);
}
