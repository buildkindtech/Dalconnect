import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { news } from "../shared/schema";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.DATABASE_URL!;

const pool = new pg.Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function main() {
  const allNews = await db.select().from(news).orderBy(sql`${news.created_at} DESC`).limit(5);
  
  console.log(`\n📊 Total news in DB: ${allNews.length}`);
  console.log('\n🔍 Latest 5 news:\n');
  
  allNews.forEach((item, i) => {
    console.log(`${i + 1}. [${item.category}] ${item.title}`);
    console.log(`   Source: ${item.source}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   Published: ${item.published_date}`);
    console.log('');
  });
  
  // Count by category
  const categoryCounts = await db.execute(sql`
    SELECT category, COUNT(*) as count 
    FROM news 
    GROUP BY category 
    ORDER BY count DESC
  `);
  
  console.log('📈 News by category:');
  categoryCounts.rows.forEach((row: any) => {
    console.log(`   ${row.category}: ${row.count}`);
  });
  
  await pool.end();
}

main().catch(console.error);
