import * as dotenv from "dotenv";
// Load environment variables FIRST before importing db
dotenv.config();

import axios from "axios";
import { db } from "../server/db";
import { businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

// 한인 업체 검색 키워드 (카테고리별)
const SEARCH_QUERIES = [
  // 식당
  "Korean restaurant Dallas Texas",
  "Korean BBQ Dallas Texas",
  "Korean food Carrollton Texas",
  "Korean restaurant Plano Texas",
  "Korean food Irving Texas",
  
  // 마트/식료품
  "Korean grocery store Dallas Texas",
  "H Mart Dallas Texas",
  "Korean supermarket Carrollton Texas",
  "Asian supermarket Dallas Texas",
  
  // 교회
  "Korean church Dallas Texas",
  "Korean church Plano Texas",
  "Korean church Carrollton Texas",
  "Korean church Irving Texas",
  
  // 병원/의료
  "Korean doctor Dallas Texas",
  "Korean clinic Dallas Texas",
  "Korean dentist Dallas Texas",
  
  // 미용/네일
  "Korean hair salon Dallas Texas",
  "Korean nail salon Dallas Texas",
  "Korean spa Dallas Texas",
  
  // 학원/교육
  "Korean academy Dallas Texas",
  "Korean tutoring Dallas Texas",
  "Korean music school Dallas Texas",
  
  // 부동산
  "Korean realtor Dallas Texas",
  "Korean real estate Dallas Texas",
  
  // 자동차
  "Korean auto repair Dallas Texas",
  "Korean car dealer Dallas Texas",
  
  // 법률/회계
  "Korean lawyer Dallas Texas",
  "Korean CPA Dallas Texas",
  
  // 기타 서비스
  "Korean business Dallas Texas",
  "Korean service Dallas Texas"
];

// 카테고리 매핑
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
  console.log("🚀 Starting Korean business scraping for Dallas area...\n");
  
  const allBusinesses = new Map(); // id를 키로 중복 제거
  
  // 각 검색 쿼리 실행
  for (const query of SEARCH_QUERIES) {
    console.log(`🔍 Searching: ${query}`);
    const places = await searchPlaces(query);
    
    console.log(`   Found ${places.length} results`);
    
    for (const place of places) {
      if (!allBusinesses.has(place.id)) {
        allBusinesses.set(place.id, place);
      }
    }
    
    // Rate limit 방지 (1초 대기)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Found ${allBusinesses.size} unique businesses\n`);
  
  let added = 0;
  let skipped = 0;
  let errors = 0;
  
  // 각 업체 DB 저장
  for (const [placeId, place] of allBusinesses) {
    try {
      // DB에 이미 존재하는지 확인
      const existing = await db.select().from(businesses).where(eq(businesses.googlePlaceId, placeId)).limit(1);
      
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
      
      // 주소에서 도시 추출 (Dallas, Plano, Carrollton, Irving 등)
      const address = place.formattedAddress || "";
      let city = null;
      const cities = ['Dallas', 'Plano', 'Carrollton', 'Irving', 'Richardson', 'Frisco', 'McKinney', 'Allen', 'Garland', 'Lewisville'];
      for (const c of cities) {
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
        description: `${category} in Dallas area`,
        hours: hoursJson as any,
        logo_url: null,
        cover_url: null,
        photos: null,
        tier: 'free',
        featured: false,
        claimed: false,
        rating: place.rating?.toString() || '0',
        review_count: place.userRatingCount || 0
      });
      
      added++;
      console.log(`✅ Added: ${place.displayName?.text} (${category})`);
    } catch (error) {
      errors++;
      console.error(`❌ Error saving ${place.displayName?.text}:`, error);
    }
  }
  
  console.log(`\n🎉 Scraping complete!`);
  console.log(`📊 Added: ${added} businesses`);
  console.log(`⏭️  Skipped: ${skipped} (already in database)`);
  console.log(`❌ Errors: ${errors}`);
  
  process.exit(0);
}

main().catch(console.error);
