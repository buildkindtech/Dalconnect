delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkCharts() {
  const charts = await sql`
    SELECT rank, title_ko, artist, youtube_url, thumbnail_url
    FROM charts 
    ORDER BY rank 
    LIMIT 5
  `;
  
  console.log('📊 Charts 데이터 확인:\n');
  charts.forEach(c => {
    console.log(`${c.rank}. ${c.title_ko} - ${c.artist}`);
    console.log(`   YouTube: ${c.youtube_url || '❌ NULL'}`);
    console.log(`   Thumbnail: ${c.thumbnail_url ? '✅ 있음' : '❌ NULL'}\n`);
  });
}

checkCharts().catch(console.error);
