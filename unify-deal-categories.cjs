delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 카테고리 매핑 규칙
const categoryMap = {
  // 식료품
  '식품': '식료품',
  'grocery': '식료품',
  'general': '식료품',  // 대부분 식품 관련
  
  // 맛집
  '레스토랑': '맛집',
  'restaurant': '맛집',
  
  // 뷰티
  '뷰티': '뷰티',
  
  // 쇼핑
  '가전': '쇼핑',
  '의류': '쇼핑',
  '도서': '쇼핑',
  
  // 기타 → 쿠폰
  '교육': '쿠폰',
  '보험': '쿠폰',
  '서비스': '쿠폰'
};

async function unifyCategories() {
  console.log('🔄 카테고리 통일 작업 시작...\n');
  
  for (const [oldCat, newCat] of Object.entries(categoryMap)) {
    const result = await sql`
      UPDATE deals
      SET category = ${newCat}
      WHERE category = ${oldCat}
      RETURNING id, title
    `;
    
    if (result.length > 0) {
      console.log(`✅ "${oldCat}" → "${newCat}": ${result.length}개 업데이트`);
    }
  }
  
  // 결과 확인
  console.log('\n📊 업데이트 후 카테고리 분포:\n');
  const categories = await sql`
    SELECT category, COUNT(*) as count
    FROM deals
    WHERE expires_at > NOW()
    GROUP BY category
    ORDER BY count DESC
  `;
  
  categories.forEach(c => {
    console.log(`   ${c.category}: ${c.count}개`);
  });
}

unifyCategories().catch(console.error);
