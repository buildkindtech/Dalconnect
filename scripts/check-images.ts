import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const result = await pool.query(
    "SELECT name_en, name_ko, cover_url FROM businesses WHERE cover_url IS NOT NULL LIMIT 10"
  );
  
  console.log("📸 업체 이미지 샘플 (cover_url이 있는 업체):\n");
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.name_ko || row.name_en}`);
    console.log(`   ${row.cover_url}\n`);
  });
  
  await pool.end();
}

main().catch(console.error);
