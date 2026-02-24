require('dotenv').config();
const axios = require('axios');
const pg = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Austin 한인 업소 검색어 리스트
const AUSTIN_SEARCH_QUERIES = [
  // 식당
  "Korean restaurant Austin TX", 
  "Korean BBQ Austin TX",
  "Korean food Austin Texas",
  "한식당 오스틴",
  "Korean restaurant North Austin",
  "Korean restaurant Round Rock",
  "Korean cafe Austin TX",
  "Korean bakery Austin",
  "Korean fried chicken Austin",
  "Korean noodles Austin",
  "Korean grill Austin",
  
  // 마트/식료품
  "Korean grocery Austin TX",
  "Korean market Austin TX", 
  "H Mart Austin",
  "Korean supermarket Austin",
  "Korean food store Austin",
  "Korean mart Round Rock",
  "Asian grocery Austin Korean",
  
  // 미용/스파
  "Korean hair salon Austin TX",
  "Korean beauty Austin",
  "Korean spa Austin",
  "Korean nail salon Austin",
  "Korean hair stylist Austin",
  "Korean massage Austin",
  "한인 미용실 오스틴",
  
  // 교회
  "Korean church Austin TX",
  "Korean church Round Rock",
  "Korean church Cedar Park",
  "한인교회 오스틴",
  "Korean Baptist church Austin",
  "Korean Methodist church Austin",
  "Korean Presbyterian Austin",
  
  // 의료/건강
  "Korean doctor Austin TX",
  "Korean dentist Austin",
  "Korean clinic Austin",
  "한의원 오스틴",
  "Korean acupuncture Austin",
  "Korean chiropractor Austin",
  "Korean pediatrician Austin",
  "Korean dermatologist Austin",
  
  // 자동차
  "Korean auto repair Austin TX",
  "Korean mechanic Austin",
  "Korean car dealer Austin",
  "Korean auto shop Austin",
  "한인 정비소 오스틴",
  
  // 부동산
  "Korean realtor Austin TX",
  "Korean real estate Austin",
  "Korean property Austin",
  "한인 부동산 오스틴",
  "Korean realtor Round Rock",
  
  // 법률/회계/보험
  "Korean lawyer Austin TX",
  "Korean attorney Austin",
  "Korean CPA Austin",
  "Korean accountant Austin",
  "Korean tax service Austin",
  "Korean insurance Austin",
  "한인 변호사 오스틴",
  "한인 회계사 오스틴",
  
  // 교육
  "Korean academy Austin TX",
  "Korean school Austin",
  "Korean tutoring Austin",
  "Korean daycare Austin",
  "Korean music lessons Austin",
  "태권도 오스틴",
  "Korean language school Austin",
  
  // 기타 서비스
  "Korean travel agency Austin",
  "Korean photographer Austin",
  "Korean wedding Austin", 
  "Korean cleaning service Austin",
  "Korean moving company Austin",
  "Korean handyman Austin",
  "Korean IT service Austin",
  "Korean computer repair Austin"
];

// Austin 지역 (locationBias 중심점 + 반경)
const AUSTIN_LOCATIONS = [
  // Austin 주요 지역
  { name: "North Austin", lat: 30.3669, lng: -97.7428, radius: 8000 },
  { name: "Central Austin", lat: 30.2672, lng: -97.7431, radius: 8000 },
  { name: "South Austin", lat: 30.2000, lng: -97.7900, radius: 8000 },
  { name: "West Austin", lat: 30.2700, lng: -97.8200, radius: 8000 },
  { name: "East Austin", lat: 30.2700, lng: -97.7000, radius: 8000 },
  
  // Austin 근교 도시들
  { name: "Round Rock", lat: 30.5083, lng: -97.6789, radius: 8000 },
  { name: "Cedar Park", lat: 30.5052, lng: -97.8203, radius: 8000 },
  { name: "Pflugerville", lat: 30.4394, lng: -97.6200, radius: 6000 },
  { name: "Georgetown", lat: 30.6333, lng: -97.6779, radius: 8000 },
  { name: "Leander", lat: 30.5788, lng: -97.8531, radius: 6000 },
  { name: "Bee Cave", lat: 30.3077, lng: -97.9475, radius: 6000 },
  { name: "Lakeway", lat: 30.3688, lng: -97.9753, radius: 6000 },
  
  // 대학 근처
  { name: "UT Campus Area", lat: 30.2849, lng: -97.7341, radius: 5000 },
  { name: "West Campus", lat: 30.2900, lng: -97.7500, radius: 4000 }
];

// 카테고리 매핑
function mapCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('restaurant') || q.includes('food') || q.includes('bbq') || q.includes('한식당') || q.includes('grill') || q.includes('chicken') || q.includes('noodles')) return 'restaurant';
  if (q.includes('cafe') || q.includes('카페') || q.includes('bakery')) return 'cafe';
  if (q.includes('hair') || q.includes('beauty') || q.includes('nail') || q.includes('spa') || q.includes('미용실') || q.includes('massage') || q.includes('stylist')) return 'beauty';
  if (q.includes('church') || q.includes('교회') || q.includes('baptist') || q.includes('methodist') || q.includes('presbyterian')) return 'church';
  if (q.includes('auto') || q.includes('정비소') || q.includes('dealer') || q.includes('mechanic') || q.includes('car')) return 'automotive';
  if (q.includes('doctor') || q.includes('clinic') || q.includes('dentist') || q.includes('병원') || q.includes('치과') || q.includes('한의원') || q.includes('acupuncture') || q.includes('chiropractor') || q.includes('pediatrician') || q.includes('dermatologist')) return 'healthcare';
  if (q.includes('lawyer') || q.includes('attorney') || q.includes('변호사')) return 'legal';
  if (q.includes('cpa') || q.includes('회계사') || q.includes('tax') || q.includes('accountant')) return 'accounting';
  if (q.includes('realtor') || q.includes('real estate') || q.includes('부동산') || q.includes('property')) return 'real_estate';
  if (q.includes('market') || q.includes('grocery') || q.includes('mart') || q.includes('마트') || q.includes('supermarket') || q.includes('store')) return 'grocery';
  if (q.includes('school') || q.includes('academy') || q.includes('tutoring') || q.includes('태권도') || q.includes('학원') || q.includes('daycare') || q.includes('lessons') || q.includes('language')) return 'education';
  if (q.includes('insurance') || q.includes('보험')) return 'insurance';
  if (q.includes('travel') || q.includes('agency')) return 'travel';
  if (q.includes('photographer') || q.includes('wedding')) return 'photography';
  if (q.includes('cleaning') || q.includes('moving') || q.includes('handyman') || q.includes('computer') || q.includes('it')) return 'home_services';
  return 'other';
}

// 한글 체크
function hasKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
}

// City 추출 (Austin 지역 체크)
function extractCity(addressComponents, formattedAddress) {
  if (!addressComponents) return null;
  
  // Austin 관련 키워드들
  const austinKeywords = ['austin', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'leander', 'bee cave', 'lakeway'];
  const address = (formattedAddress || '').toLowerCase();
  
  // formattedAddress에서 Austin 지역 체크
  for (const keyword of austinKeywords) {
    if (address.includes(keyword)) {
      return keyword.replace(/\b\w/g, l => l.toUpperCase()); // Title case
    }
  }
  
  // addressComponents에서 locality 추출
  for (const comp of addressComponents) {
    if (comp.types && comp.types.includes('locality')) {
      const city = comp.longText || comp.shortText;
      if (austinKeywords.includes(city.toLowerCase())) {
        return city;
      }
    }
  }
  
  // 기본값은 Austin
  return 'Austin';
}

// Photo URL 생성
function getPhotoUrl(photoName) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${API_KEY}`;
}

// 중복 체크
async function isExistingPlaceId(googlePlaceId) {
  try {
    const result = await pool.query(
      'SELECT id FROM businesses WHERE google_place_id = $1',
      [googlePlaceId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('   ❌ DB 체크 에러:', error.message);
    return false;
  }
}

// Places API 검색
async function searchPlaces(query, location) {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: query,
        languageCode: 'en',
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: location.radius
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours,places.photos,places.addressComponents'
        }
      }
    );
    
    return response.data.places || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error(`   ❌ API 에러 (${error.response?.status}):`, error.response?.data?.error?.message || error.message);
    return [];
  }
}

// 업체 저장 (Austin 전용)
async function saveBusiness(place, category) {
  try {
    // google_place_id 추출 (places/ 접두사 제거)
    const googlePlaceId = place.id.replace('places/', '');
    
    // 이미 존재하는지 확인
    if (await isExistingPlaceId(googlePlaceId)) {
      return { status: 'duplicate', id: googlePlaceId };
    }
    
    // formattedAddress에서 Texas 확인
    const address = place.formattedAddress || '';
    if (!address.includes('TX') && !address.includes('Texas')) {
      return { status: 'filtered', reason: 'not_texas' };
    }
    
    // Austin 지역이 아닌 경우 필터링
    const austinKeywords = ['austin', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'leander', 'bee cave', 'lakeway'];
    const hasAustinKeyword = austinKeywords.some(keyword => address.toLowerCase().includes(keyword));
    
    if (!hasAustinKeyword) {
      return { status: 'filtered', reason: 'not_austin_area' };
    }
    
    // 이름
    const name = place.displayName?.text || '';
    const nameKo = hasKorean(name) ? name : null;
    const nameEn = nameKo ? name : name; // 한글 있으면 그대로, 없으면 영어로
    
    // 한국 업소 필터링 (이름에 한글이 있거나 Korean 키워드가 있는지 확인)
    const isKoreanBusiness = hasKorean(name) || 
      name.toLowerCase().includes('korean') || 
      name.toLowerCase().includes('korea') ||
      (place.websiteUri && (place.websiteUri.includes('korea') || hasKorean(place.websiteUri)));
    
    if (!isKoreanBusiness) {
      return { status: 'filtered', reason: 'not_korean_business' };
    }
    
    // City 추출
    const city = extractCity(place.addressComponents, address);
    
    // 사진
    let coverUrl = null;
    let photos = [];
    if (place.photos && place.photos.length > 0) {
      coverUrl = getPhotoUrl(place.photos[0].name);
      photos = place.photos.slice(0, 6).map(p => getPhotoUrl(p.name));
    }
    
    // Hours 파싱
    let hours = null;
    if (place.regularOpeningHours?.weekdayDescriptions) {
      hours = {};
      place.regularOpeningHours.weekdayDescriptions.forEach(desc => {
        const [day, ...timeParts] = desc.split(': ');
        hours[day] = timeParts.join(': ');
      });
    }
    
    // DB 삽입 (Austin으로 설정)
    const query = `
      INSERT INTO businesses (
        name_en, name_ko, category, address, city, phone, website,
        hours, cover_url, photos, rating, review_count, google_place_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    
    const values = [
      nameEn,
      nameKo,
      category,
      address,
      'austin', // 모든 Austin 업소는 'austin'으로 저장
      place.nationalPhoneNumber || null,
      place.websiteUri || null,
      hours ? JSON.stringify(hours) : null,
      coverUrl,
      photos.length > 0 ? JSON.stringify(photos) : null,
      place.rating || 0,
      place.userRatingCount || 0,
      googlePlaceId
    ];
    
    const result = await pool.query(query, values);
    
    return { status: 'saved', id: result.rows[0].id, name: nameKo || nameEn, actualCity: city };
  } catch (error) {
    console.error('   ❌ 저장 에러:', error.message);
    return { status: 'error', error: error.message };
  }
}

// 딜레이
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인
async function main() {
  console.log('🔍 Austin 한인 업소 Google Places API 스크래핑 시작\n');
  console.log(`📊 검색어: ${AUSTIN_SEARCH_QUERIES.length}개`);
  console.log(`📍 지역: ${AUSTIN_LOCATIONS.length}개`);
  console.log(`🎯 총 조합: ${AUSTIN_SEARCH_QUERIES.length * AUSTIN_LOCATIONS.length}개\n`);
  
  const stats = {
    total: 0,
    saved: 0,
    duplicate: 0,
    filtered: 0,
    error: 0
  };
  
  const filterReasons = {};
  
  let combinationIndex = 0;
  const totalCombinations = AUSTIN_SEARCH_QUERIES.length * AUSTIN_LOCATIONS.length;
  
  for (const query of AUSTIN_SEARCH_QUERIES) {
    const category = mapCategory(query);
    
    for (const location of AUSTIN_LOCATIONS) {
      combinationIndex++;
      const progress = ((combinationIndex / totalCombinations) * 100).toFixed(1);
      
      console.log(`\n[${combinationIndex}/${totalCombinations}] (${progress}%)`);
      console.log(`🔍 "${query}" @ ${location.name}`);
      console.log(`📂 카테고리: ${category}`);
      
      const places = await searchPlaces(query, location);
      console.log(`   결과: ${places.length}개`);
      
      for (const place of places) {
        stats.total++;
        const result = await saveBusiness(place, category);
        
        if (result.status === 'saved') {
          stats.saved++;
          console.log(`   ✅ 저장: ${result.name} (${result.actualCity})`);
        } else if (result.status === 'duplicate') {
          stats.duplicate++;
          console.log(`   ⏭️  중복: ${result.id}`);
        } else if (result.status === 'filtered') {
          stats.filtered++;
          filterReasons[result.reason] = (filterReasons[result.reason] || 0) + 1;
          console.log(`   ⚠️  필터링: ${result.reason}`);
        } else if (result.status === 'error') {
          stats.error++;
          console.log(`   ❌ 에러: ${result.error}`);
        }
      }
      
      // Rate limit: 1초 대기
      await delay(1000);
    }
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 Austin 한인 업소 스크래핑 최종 통계');
  console.log('='.repeat(80));
  console.log(`총 발견: ${stats.total}개`);
  console.log(`✅ 신규 저장: ${stats.saved}개`);
  console.log(`⏭️  중복 스킵: ${stats.duplicate}개`);
  console.log(`⚠️  필터링: ${stats.filtered}개`);
  console.log(`❌ 에러: ${stats.error}개`);
  
  if (Object.keys(filterReasons).length > 0) {
    console.log('\n📋 필터링 상세:');
    Object.entries(filterReasons).forEach(([reason, count]) => {
      console.log(`   ${reason}: ${count}개`);
    });
  }
  
  console.log('='.repeat(80));
  
  // 최종 Austin 업소 수 확인
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE city = 'austin'"
    );
    console.log(`\n🏢 총 Austin 업소 수: ${result.rows[0].count}개`);
  } catch (error) {
    console.error('업소 수 조회 에러:', error.message);
  }
  
  await pool.end();
  console.log('\n✨ Austin 스크래핑 완료!');
}

main().catch(error => {
  console.error('❌ 치명적 에러:', error);
  process.exit(1);
});