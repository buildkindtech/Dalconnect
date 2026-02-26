import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
import { businesses } from '../shared/schema.js';

dotenv.config();

async function checkData() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const all = await db.select().from(businesses);
  console.log('\n📊 Total businesses:', all.length);
  
  // Sample data
  console.log('\n📋 Sample (first 3):');
  all.slice(0, 3).forEach((b, i) => {
    console.log(`${i + 1}. ${b.name_en} (${b.category}) - ${b.city} - ⭐${b.rating} - ${b.review_count} reviews`);
  });

  // 카테고리별 count
  const categories: Record<string, number> = {};
  all.forEach(b => {
    categories[b.category] = (categories[b.category] || 0) + 1;
  });
  
  console.log('\n📂 Categories breakdown:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });

  // 도시별 count
  const cities: Record<string, number> = {};
  all.forEach(b => {
    const city = b.city || 'Unknown';
    cities[city] = (cities[city] || 0) + 1;
  });
  
  console.log('\n🏙️ Cities breakdown:');
  Object.entries(cities).sort((a, b) => b[1] - a[1]).forEach(([city, count]) => {
    console.log(`   ${city}: ${count}`);
  });

  // 데이터 완성도 체크
  const withRating = all.filter(b => parseFloat(b.rating) > 0).length;
  const withPhone = all.filter(b => b.phone).length;
  const withWebsite = all.filter(b => b.website).length;
  const withReviews = all.filter(b => b.review_count > 0).length;

  console.log('\n✅ Data completeness:');
  console.log(`   Rating: ${withRating}/${all.length} (${Math.round(withRating/all.length*100)}%)`);
  console.log(`   Phone: ${withPhone}/${all.length} (${Math.round(withPhone/all.length*100)}%)`);
  console.log(`   Website: ${withWebsite}/${all.length} (${Math.round(withWebsite/all.length*100)}%)`);
  console.log(`   Reviews: ${withReviews}/${all.length} (${Math.round(withReviews/all.length*100)}%)`);

  await pool.end();
}

checkData().catch(console.error);
