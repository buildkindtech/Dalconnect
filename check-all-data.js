const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkAllData() {
  console.log('📊 DalConnect 데이터 현황\n');
  
  // 1. Businesses
  const businesses = await sql`SELECT COUNT(*) as count FROM businesses`;
  console.log(`✅ Businesses: ${businesses[0].count}개`);
  
  // 2. News
  const news = await sql`SELECT COUNT(*) as count FROM news`;
  console.log(`📰 News: ${news[0].count}개`);
  
  // 3. Deals
  const deals = await sql`SELECT COUNT(*) as count FROM deals WHERE expires_at > NOW()`;
  console.log(`🏷️ Deals (활성): ${deals[0].count}개`);
  
  // 4. Charts - Check if table exists and data
  try {
    const charts = await sql`SELECT COUNT(*) as count FROM charts`;
    console.log(`🎵 Charts: ${charts[0].count}개`);
    
    // Show sample chart data
    const sampleCharts = await sql`SELECT id, title, artist, youtube_url FROM charts LIMIT 3`;
    console.log('\nSample Charts:');
    sampleCharts.forEach(c => console.log(`  - ${c.title} by ${c.artist} (${c.youtube_url || 'No URL'})`));
  } catch (e) {
    console.log(`❌ Charts 테이블: ${e.message}`);
  }
  
  // 5. Blogs
  const blogs = await sql`SELECT COUNT(*) as count FROM blogs`;
  console.log(`\n📝 Blogs: ${blogs[0].count}개`);
  
  // 6. Listings (Marketplace)
  const listings = await sql`SELECT COUNT(*) as count FROM listings`;
  console.log(`🛒 Listings: ${listings[0].count}개`);
  
  // 7. Community
  const community = await sql`SELECT COUNT(*) as count FROM community_posts`;
  console.log(`💬 Community: ${community[0].count}개`);
  
  // Check charts table schema
  console.log('\n📋 Charts 테이블 구조:');
  const chartSchema = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'charts'
    ORDER BY ordinal_position
  `;
  chartSchema.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
}

checkAllData().catch(console.error);
