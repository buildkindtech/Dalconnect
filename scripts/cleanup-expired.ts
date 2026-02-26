import * as dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { deals, listings } from "../shared/schema";
import { sql, and, lte } from "drizzle-orm";

dotenv.config();

async function cleanupExpired() {
  console.log("🧹 DalConnect 만료 데이터 정리 시작...\n");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found!");
    process.exit(1);
  }
  
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    // 1. 만료된 쿠폰/딜 삭제 (expires_at이 있다면)
    const dealsResult = await pool.query(`
      DELETE FROM deals 
      WHERE expires_at < NOW()
      RETURNING id, title
    `);
    
    if (dealsResult.rows.length > 0) {
      console.log(`💰 쿠폰/딜: ${dealsResult.rows.length}개 삭제`);
      dealsResult.rows.forEach((deal: any) => {
        console.log(`   - ${deal.title}`);
      });
    } else {
      console.log(`💰 쿠폰/딜: 만료된 항목 없음`);
    }
    
    // 2. 만료된 마켓플레이스 리스팅 상태 업데이트
    const listingsResult = await pool.query(`
      UPDATE listings 
      SET status = 'expired'
      WHERE expires_at < NOW() 
        AND status = 'active'
      RETURNING id, title
    `);
    
    if (listingsResult.rows.length > 0) {
      console.log(`\n🛒 마켓플레이스: ${listingsResult.rows.length}개 만료 처리`);
      listingsResult.rows.forEach((listing: any) => {
        console.log(`   - ${listing.title}`);
      });
    } else {
      console.log(`\n🛒 마켓플레이스: 만료된 항목 없음`);
    }
    
    // 3. 30일 이상 지난 만료 리스팅 삭제
    const oldListingsResult = await pool.query(`
      DELETE FROM listings 
      WHERE status = 'expired' 
        AND expires_at < NOW() - INTERVAL '30 days'
      RETURNING id, title
    `);
    
    if (oldListingsResult.rows.length > 0) {
      console.log(`\n🗑️  오래된 리스팅: ${oldListingsResult.rows.length}개 삭제`);
    } else {
      console.log(`\n🗑️  오래된 리스팅: 삭제할 항목 없음`);
    }
    
    console.log(`\n✅ 정리 완료!`);
    
  } catch (error: any) {
    console.error("\n❌ 정리 실패:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

cleanupExpired().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
