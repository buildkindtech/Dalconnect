delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkFeatured() {
  // 1. Check if featured column exists
  const schema = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'featured'
  `;
  
  console.log('1. Featured 컬럼 존재:', schema.length > 0 ? '✅ YES' : '❌ NO');
  
  if (schema.length > 0) {
    // 2. Check how many featured businesses exist
    const featured = await sql`SELECT COUNT(*) as count FROM businesses WHERE featured = true`;
    console.log(`2. Featured 비즈니스 개수: ${featured[0].count}개`);
    
    // 3. Show sample featured businesses
    if (featured[0].count > 0) {
      const samples = await sql`
        SELECT id, name_ko, name_en, category, rating, featured 
        FROM businesses 
        WHERE featured = true 
        LIMIT 5
      `;
      console.log('\n3. Featured 비즈니스 샘플:');
      samples.forEach(b => console.log(`   - ${b.name_ko || b.name_en} (${b.category}, ⭐${b.rating || 'N/A'})`));
    }
  } else {
    console.log('❌ businesses 테이블에 featured 컬럼이 없습니다!');
  }
  
  // 4. Check total businesses
  const total = await sql`SELECT COUNT(*) as count FROM businesses`;
  console.log(`\n4. 전체 비즈니스 개수: ${total[0].count}개`);
}

checkFeatured().catch(console.error);
