import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("🔧 Fixing database schema...\n");
  
  try {
    // Add google_place_id column
    console.log("Adding google_place_id column...");
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(500) UNIQUE
    `);
    console.log("✅ Column added successfully\n");
    
    // Check table structure
    console.log("Current table structure:");
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position
    `);
    
    console.table(result.rows);
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

main();
