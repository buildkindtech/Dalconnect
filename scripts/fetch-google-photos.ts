import * as dotenv from "dotenv";
import axios from "axios";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found!");
  process.exit(1);
}

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.error("❌ GOOGLE_MAPS_API_KEY not found!");
  process.exit(1);
}

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(pool);

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface PlaceDetails {
  photos?: PlacePhoto[];
}

// Place Details 가져오기
async function getPlaceDetails(googlePlaceId: string): Promise<PlaceDetails | null> {
  try {
    const response = await axios.get(`${PLACE_DETAILS_URL}/${googlePlaceId}`, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "photos"
      }
    });
    
    return response.data;
  } catch (error: any) {
    // 404는 사진이 없는 정상적인 케이스
    if (error.response?.status === 404) {
      return null;
    }
    console.error(`   ❌ API Error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

// Photo URL 생성
function getPhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${API_KEY}`;
}

async function main() {
  console.log("📸 Google Places 실제 사진 가져오기 시작...\n");
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  
  // google_place_id가 있는 모든 업체 가져오기
  const allBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.google_place_id, businesses.google_place_id));
  
  const businessesWithPlaceId = allBusinesses.filter(b => b.google_place_id);
  
  console.log(`📊 총 ${businessesWithPlaceId.length}개 업체 중 google_place_id가 있는 업체 처리\n`);
  
  let success = 0;
  let noPhotos = 0;
  let errors = 0;
  
  for (let i = 0; i < businessesWithPlaceId.length; i++) {
    const business = businessesWithPlaceId[i];
    const progress = ((i + 1) / businessesWithPlaceId.length * 100).toFixed(1);
    
    console.log(`\n[${progress}%] ${business.name_ko || business.name_en}`);
    console.log(`   Place ID: ${business.google_place_id}`);
    
    // Place Details 가져오기
    const details = await getPlaceDetails(business.google_place_id!);
    
    if (!details || !details.photos || details.photos.length === 0) {
      console.log(`   ⚠️  사진 없음 - NULL 유지`);
      noPhotos++;
    } else {
      const photoUrls = details.photos.map(photo => getPhotoUrl(photo.name));
      const coverUrl = photoUrls[0];
      const additionalPhotos = photoUrls.slice(1, 6); // 최대 5장 추가 사진
      
      console.log(`   ✅ ${details.photos.length}장의 사진 발견`);
      console.log(`   📷 Cover: ${coverUrl.substring(0, 80)}...`);
      
      // DB 업데이트
      await db
        .update(businesses)
        .set({
          cover_url: coverUrl,
          photos: additionalPhotos.length > 0 ? additionalPhotos : null
        })
        .where(eq(businesses.id, business.id));
      
      success++;
    }
    
    // Rate limit 방지 (0.5초 대기)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 100개마다 중간 보고
    if ((i + 1) % 100 === 0) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 중간 보고 (${i + 1}/${businessesWithPlaceId.length})`);
      console.log(`   ✅ 사진 추가: ${success}개`);
      console.log(`   ⚠️  사진 없음: ${noPhotos}개`);
      console.log(`   ❌ 에러: ${errors}개`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
  }
  
  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Google Places 사진 가져오기 완료!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 총 처리: ${businessesWithPlaceId.length}개`);
  console.log(`   ✅ 사진 추가: ${success}개`);
  console.log(`   ⚠️  사진 없음: ${noPhotos}개`);
  console.log(`   ❌ 에러: ${errors}개`);
  console.log(`\n💡 실제 업체 사진만 사용 - 스톡 이미지 없음!`);
  
  await pool.end();
}

main().catch(console.error);
