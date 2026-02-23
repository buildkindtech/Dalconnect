import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found!");
  process.exit(1);
}

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 스톡 이미지 도메인 목록
const STOCK_IMAGE_DOMAINS = [
  'unsplash.com',
  'images.unsplash.com',
  'pexels.com',
  'pixabay.com',
  'freepik.com',
  'shutterstock.com',
  'istockphoto.com',
  'gettyimages.com'
];

function isStockImage(url: string | null): boolean {
  if (!url) return false;
  return STOCK_IMAGE_DOMAINS.some(domain => url.includes(domain));
}

async function main() {
  console.log("🖼️  이미지 정리 시작...\n");
  
  // 업체 이미지 확인
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 업체 이미지 검사\n");
  
  const businessResult = await pool.query(
    "SELECT id, name_en, name_ko, cover_url, logo_url, photos FROM businesses WHERE cover_url IS NOT NULL OR logo_url IS NOT NULL OR photos IS NOT NULL"
  );
  
  console.log(`🔍 총 ${businessResult.rows.length}개 업체에 이미지가 있습니다.\n`);
  
  let businessCleaned = 0;
  
  for (const business of businessResult.rows) {
    let needsUpdate = false;
    const updates: string[] = [];
    
    // cover_url 확인
    if (isStockImage(business.cover_url)) {
      console.log(`❌ 스톡 이미지 발견 (cover): ${business.name_ko || business.name_en}`);
      console.log(`   URL: ${business.cover_url}`);
      updates.push("cover_url = NULL");
      needsUpdate = true;
    }
    
    // logo_url 확인
    if (isStockImage(business.logo_url)) {
      console.log(`❌ 스톡 이미지 발견 (logo): ${business.name_ko || business.name_en}`);
      console.log(`   URL: ${business.logo_url}`);
      updates.push("logo_url = NULL");
      needsUpdate = true;
    }
    
    // photos 배열 확인
    if (business.photos && Array.isArray(business.photos)) {
      const hasStockPhotos = business.photos.some((photo: string) => isStockImage(photo));
      if (hasStockPhotos) {
        console.log(`❌ 스톡 이미지 발견 (photos): ${business.name_ko || business.name_en}`);
        updates.push("photos = NULL");
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      const updateQuery = `UPDATE businesses SET ${updates.join(', ')} WHERE id = $1`;
      await pool.query(updateQuery, [business.id]);
      businessCleaned++;
      console.log(`   ✅ 정리 완료\n`);
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📰 뉴스 이미지 검사\n`);
  
  const newsResult = await pool.query(
    "SELECT id, title, thumbnail_url FROM news WHERE thumbnail_url IS NOT NULL"
  );
  
  console.log(`🔍 총 ${newsResult.rows.length}개 뉴스에 썸네일이 있습니다.\n`);
  
  let newsCleaned = 0;
  
  for (const news of newsResult.rows) {
    if (isStockImage(news.thumbnail_url)) {
      console.log(`❌ 스톡 이미지 발견: ${news.title}`);
      console.log(`   URL: ${news.thumbnail_url}`);
      
      await pool.query("UPDATE news SET thumbnail_url = NULL WHERE id = $1", [news.id]);
      newsCleaned++;
      console.log(`   ✅ 정리 완료\n`);
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 이미지 정리 완료!`);
  console.log(`   📊 업체: ${businessCleaned}개 정리`);
  console.log(`   📰 뉴스: ${newsCleaned}개 정리`);
  console.log(`\n💡 실제 업체 사진은 Google Places API에서 가져올 수 있습니다.`);
  
  await pool.end();
}

main().catch(console.error);
