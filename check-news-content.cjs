delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkNews() {
  // 최근 뉴스 3개 확인
  const news = await sql`
    SELECT id, title, content, source, url, category, created_at
    FROM news
    ORDER BY created_at DESC
    LIMIT 3
  `;
  
  console.log('📰 최근 뉴스 3개 샘플:\n');
  
  news.forEach((n, idx) => {
    console.log(`${idx + 1}. ${n.title}`);
    console.log(`   카테고리: ${n.category || 'N/A'}`);
    console.log(`   출처: ${n.source || 'N/A'}`);
    console.log(`   URL: ${n.url || 'N/A'}`);
    console.log(`   내용 길이: ${n.content ? n.content.length : 0}자`);
    if (n.content) {
      console.log(`   내용 미리보기: ${n.content.substring(0, 200)}...`);
    }
    console.log('');
  });
  
  // 전체 통계
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      AVG(LENGTH(content)) as avg_length,
      COUNT(CASE WHEN source IS NULL OR source = '' THEN 1 END) as no_source,
      COUNT(CASE WHEN url IS NULL OR url = '' THEN 1 END) as no_url
    FROM news
  `;
  
  console.log('📊 전체 뉴스 통계:');
  console.log(`   총 ${stats[0].total}개`);
  console.log(`   평균 내용 길이: ${Math.round(stats[0].avg_length)}자`);
  console.log(`   출처 없음: ${stats[0].no_source}개`);
  console.log(`   URL 없음: ${stats[0].no_url}개`);
}

checkNews().catch(console.error);
