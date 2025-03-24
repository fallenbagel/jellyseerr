import Database from 'better-sqlite3';
import path from 'path';

try {
    const db = new Database(path.join(process.cwd(), 'config/db/db.sqlite3'));

    // Get table info
    const tableInfo = db.prepare(`
        SELECT * FROM pragma_table_info('user')
    `).all();

    console.log('User table structure:');
    console.table(tableInfo);

    // Check for any existing OIDC users
    const oidcUsers = db.prepare(`
        SELECT id, email, oidcId
        FROM user
        WHERE oidcId IS NOT NULL
    `).all();

    console.log('\nOIDC Users:', oidcUsers.length ? oidcUsers : 'None found');

    db.close();
} catch (err) {
    console.error('Failed to read database:', err);
    process.exit(1);
}
