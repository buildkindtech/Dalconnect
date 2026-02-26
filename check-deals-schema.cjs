delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  const schema = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'deals'
    ORDER BY ordinal_position
  `;
  
  console.log('📋 Deals 테이블 구조:');
  schema.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
}

checkSchema().catch(console.error);
