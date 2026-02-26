delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkCity() {
  // 1. Check city column values in featured businesses
  const featured = await sql`
    SELECT id, name_ko, city, featured 
    FROM businesses 
    WHERE featured = true 
    LIMIT 10
  `;
  
  console.log('Featured 비즈니스의 City 값:');
  featured.forEach(b => console.log(`   - ${b.name_ko}: city = "${b.city}"`));
  
  // 2. Check unique city values in all businesses
  const cities = await sql`
    SELECT DISTINCT city, COUNT(*) as count 
    FROM businesses 
    GROUP BY city 
    ORDER BY count DESC
  `;
  
  console.log('\n전체 비즈니스의 City 분포:');
  cities.forEach(c => console.log(`   - "${c.city}": ${c.count}개`));
}

checkCity().catch(console.error);
