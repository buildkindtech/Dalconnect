import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    console.log('🔄 Running migration: add city column...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '../db/migrations/add_city_column.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added city column to newsletter_subscribers');
    console.log('   - Created index on city column');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
