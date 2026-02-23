import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const result = await pool.query(
    'SELECT name_en, google_place_id FROM businesses WHERE google_place_id IS NOT NULL LIMIT 5'
  );
  
  console.log('📋 Sample Place IDs:\n');
  result.rows.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name_en}`);
    console.log(`   ID: ${r.google_place_id}\n`);
  });
  
  await pool.end();
}

main().catch(console.error);
