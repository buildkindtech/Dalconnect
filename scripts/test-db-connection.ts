import * as dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { businesses, newsSubmissions } from "../shared/schema";
import { sql } from "drizzle-orm";

dotenv.config();

async function testConnection() {
  console.log("🔍 Testing Neon PostgreSQL connection...\n");
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 80)}...`);
  
  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Test 1: Simple query
    console.log("\n✅ Test 1: Basic connection");
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log(`   Current DB time: ${result.rows[0].current_time}`);
    
    // Test 2: Count businesses
    console.log("\n✅ Test 2: Count businesses");
    const businessCount = await db.select({ count: sql`count(*)` }).from(businesses);
    console.log(`   Total businesses in DB: ${businessCount[0].count}`);
    
    // Test 3: Sample businesses
    console.log("\n✅ Test 3: Sample businesses (top 5)");
    const sampleBusinesses = await db.select().from(businesses).limit(5);
    sampleBusinesses.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name_en} (${b.category}) - ${b.city}`);
    });
    
    // Test 4: Count news
    console.log("\n✅ Test 4: Count news submissions");
    const newsCount = await db.select({ count: sql`count(*)` }).from(newsSubmissions);
    console.log(`   Total news in DB: ${newsCount[0].count}`);
    
    // Test 5: Sample news
    console.log("\n✅ Test 5: Sample news (top 5)");
    const sampleNews = await db.select().from(newsSubmissions).limit(5);
    sampleNews.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.title} (${n.category})`);
    });
    
    console.log("\n🎉 All DB tests passed!\n");
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ DB Connection Failed!");
    console.error(`   Error: ${error.message}`);
    console.error(`\n🔧 Fix Required:`);
    console.error(`   1. Go to Neon Console: https://console.neon.tech`);
    console.error(`   2. Get new connection string`);
    console.error(`   3. Update .env DATABASE_URL`);
    process.exit(1);
  }
}

testConnection();
