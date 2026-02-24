import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'add_city_columns_full.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running city columns migration...');
    console.log('Migration content preview:');
    console.log(migrationSQL.substring(0, 200) + '...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n📊 Verifying changes...');
    
    // Check businesses count
    const businessResult = await client.query(`
      SELECT city, COUNT(*) as count 
      FROM businesses 
      GROUP BY city 
      ORDER BY count DESC
    `);
    console.log('Businesses by city:', businessResult.rows);
    
    // Check other tables
    const tables = ['news', 'blogs', 'listings', 'community_posts', 'newsletter_subscribers'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT city, COUNT(*) as count 
          FROM ${table} 
          GROUP BY city 
          ORDER BY count DESC
        `);
        console.log(`${table} by city:`, result.rows);
      } catch (err) {
        console.log(`${table}: No data or error -`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔐 Database connection closed');
  }
}

runMigration();