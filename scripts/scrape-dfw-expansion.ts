import * as dotenv from "dotenv";
import axios from "axios";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

// Load environment variables FIRST
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment!");
  process.exit(1);
}

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.error("❌ GOOGLE_MAPS_API_KEY not found in environment!");
  process.exit(1);
}

// Create DB connection directly
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

// DFW 전역 도시 목록
const DFW_CITIES = [
  'Dallas', 'Fort Worth', 'Plano', 'Frisco', 'McKinney', 'Prosper', 
  'Allen', 'Richardson', 'Garland', 'Irving', 'Arlington', 'Carrollton', 
  'Lewisville', 'Denton', 'Flower Mound', 'Southlake', 'Grapevine', 
  'Colleyville', 'Keller', 'Euless', 'Bedford', 'Hurst'
];

// 한인 업체 검색 키워드 (카테고리별) - 확장
const SEARCH_KEYWORDS = [
  // 식당
  "Korean restaurant",
  "Korean BBQ",
  "Korean food",
  "Korean cuisine",
  
  // 마트/식료품
  "Korean grocery store",
  "H Mart",
  "Korean supermarket",
  "Korean market",
  
  // 교회
  "Korean church",
  "Korean Presbyterian church",
  "Korean Methodist church",
  
  // 병원/의료
  "Korean doctor",
  "Korean clinic",
  "Korean dentist",
  "Korean hospital",
  
  // 미용/네일
  "Korean hair salon",
  "Korean nail salon",
  "Korean spa",
  "Korean beauty salon",
  
  // 학원/교육
  "Korean academy",
  "Korean tutoring",
  "Korean music school",
  "Korean learning center",
  
  // 부동산
  "Korean realtor",
  "Korean real estate",
  "Korean real estate agent",
  
  // 자동차
  "Korean auto repair",
  "Korean car dealer",
  "Korean mechanic",
  
  // 법률/회계
  "Korean lawyer",
  "Korean attorney",
  "Korean CPA",
  "Korean accountant",
  
  // 기타 서비스
  "Korean business",
  "Korean service"
];

// 카테고리 매핑 (기존 로직 유지)
function categorizeByName(name: string, types: string[]): string {
  const nameLower = name.toLowerCase();
  
  if (types.includes("restaurant") || nameLower.includes("restaurant") || nameLower.includes("bbq") || nameLower.includes("food")) {
    return "식당";
  }
  if (types.includes("supermarket") || nameLower.includes("mart") || nameLower.includes("market") || nameLower.includes("grocery")) {
    return "한인마트";
  }
  if (types.includes("church") || nameLower.includes("church")) {
    return "교회";
  }
  if (types.includes("doctor") || types.includes("hospital") || nameLower.includes("clinic") || nameLower.includes("medical") || nameLower.includes("dental")) {
    return "병원";
  }
  if (types.includes("hair_care") || types.includes("beauty_salon") || nameLower.includes("salon") || nameLower.includes("spa")) {
    return "미용실";
  }
  if (nameLower.includes("academy") || nameLower.includes("school") || nameLower.includes("tutoring") || nameLower.includes("학원")) {
    return "학원";
  }
  if (types.includes("real_estate_agency") || nameLower.includes("realtor") || nameLower.includes("real estate")) {
    return "부동산";
  }
  if (types.includes("car_repair") || types.includes("car_dealer") || nameLower.includes("auto")) {
    return "자동차";
  }
  if (types.includes("lawyer") || types.includes("accounting") || nameLower.includes("law") || nameLower.includes("cpa")) {
    return "법률/회계";
  }
  
  return "기타";
}

async function searchPlaces(query: string) {
  try {
    const response = await axios.post(
      PLACES_API_URL,
      {
        textQuery: query,
        languageCode: "ko",
        regionCode: "US",
        maxResultCount: 20
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location,places.types,places.businessStatus,places.regularOpeningHours"
        }
      }
    );
    
    return response.data.places || [];
  } catch (error: any) {
    console.error(`❌ Error searching for "${query}":`, error.response?.data || error.message);
    return [];
  }
}

async function main() {
  console.log("🚀 Starting DFW-wide Korean business expansion scraping...\n");
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
  console.log(`🔑 API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...`);
  console.log(`🏙️  Covering ${DFW_CITIES.length} DFW cities\n`);
  
  const allBusinesses = new Map(); // id를 키로 중복 제거
  let queryCount = 0;
  const totalQueries = DFW_CITIES.length * SEARCH_KEYWORDS.length;
  
  // 각 도시별로 각 키워드 검색
  for (const city of DFW_CITIES) {
    console.log(`\n🏙️  Searching in ${city}...`);
    
    for (const keyword of SEARCH_KEYWORDS) {
      queryCount++;
      const query = `${keyword} ${city} Texas`;
      const progress = ((queryCount / totalQueries) * 100).toFixed(1);
      
      console.log(`   [${progress}%] ${query}`);
      const places = await searchPlaces(query);
      
      if (places.length > 0) {
        console.log(`      ✅ Found ${places.length} results`);
        for (const place of places) {
          if (!allBusinesses.has(place.id)) {
            allBusinesses.set(place.id, place);
          }
        }
      }
      
      // Rate limit 방지 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n✅ Found ${allBusinesses.size} unique businesses across DFW\n`);
  
  let added = 0;
  let skipped = 0;
  let errors = 0;
  
  // 각 업체 DB 저장
  for (const [placeId, place] of allBusinesses) {
    try {
      // DB에 이미 존재하는지 확인
      const existing = await db.select().from(businesses).where(eq(businesses.google_place_id, placeId)).limit(1);
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // 카테고리 결정
      const category = categorizeByName(place.displayName?.text || "", place.types || []);
      
      // 영업시간 포맷팅 (JSON으로 변환)
      let hoursJson: Record<string, string> | null = null;
      if (place.regularOpeningHours?.weekdayDescriptions) {
        hoursJson = {};
        place.regularOpeningHours.weekdayDescriptions.forEach((day: string, index: number) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          hoursJson![days[index]] = day;
        });
      }
      
      // 주소에서 도시 추출
      const address = place.formattedAddress || "";
      let city = null;
      for (const c of DFW_CITIES) {
        if (address.includes(c)) {
          city = c;
          break;
        }
      }
      
      // DB에 저장
      await db.insert(businesses).values({
        name_en: place.displayName?.text || "Unknown",
        name_ko: null, // 한글 이름은 나중에 추가
        category,
        address,
        city,
        phone: place.nationalPhoneNumber || null,
        email: null,
        website: place.websiteUri || null,
        description: `${category} in ${city || 'DFW area'}`,
        hours: hoursJson as any,
        logo_url: null,
        cover_url: null,
        photos: null,
        tier: 'free',
        featured: false,
        claimed: false,
        rating: place.rating?.toString() || '0',
        review_count: place.userRatingCount || 0,
        google_place_id: placeId
      });
      
      added++;
      if (added % 10 === 0) {
        console.log(`   ✅ Progress: ${added} businesses added so far...`);
      }
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Error saving ${place.displayName?.text}:`, error.message);
    }
  }
  
  console.log(`\n🎉 DFW Expansion scraping complete!`);
  console.log(`📊 Added: ${added} new businesses`);
  console.log(`⏭️  Skipped: ${skipped} (already in database)`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`\n📍 Cities covered: ${DFW_CITIES.join(', ')}`);
  
  await pool.end();
  process.exit(0);
}

main().catch(console.error);
