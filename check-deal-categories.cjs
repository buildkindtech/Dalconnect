delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkCategories() {
  // 현재 딜들의 카테고리 확인
  const categories = await sql`
    SELECT category, COUNT(*) as count
    FROM deals
    WHERE expires_at > NOW()
    GROUP BY category
    ORDER BY count DESC
  `;
  
  console.log('📊 현재 딜 카테고리 분포:\n');
  categories.forEach(c => {
    console.log(`   ${c.category}: ${c.count}개`);
  });
  
  // 샘플 데이터 확인
  console.log('\n📝 각 카테고리 샘플:\n');
  const samples = await sql`
    SELECT category, title, store
    FROM deals
    WHERE expires_at > NOW()
    ORDER BY category, created_at DESC
  `;
  
  let currentCategory = '';
  samples.slice(0, 15).forEach(d => {
    if (d.category !== currentCategory) {
      console.log(`\n[${d.category}]`);
      currentCategory = d.category;
    }
    console.log(`  - ${d.title} (${d.store})`);
  });
}

checkCategories().catch(console.error);
