require('dotenv').config();
const axios = require('axios');
const pg = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 검색어 리스트 (한국어 + 영어 조합)
const SEARCH_QUERIES = [
  // 식당
  "한식당 Carrollton TX", "Korean restaurant Carrollton", "Korean BBQ Dallas",
  "한식당 Plano", "Korean food Plano", "Korean restaurant Frisco",
  "Korean restaurant Irving", "Korean restaurant Lewisville",
  "분식 Dallas", "치킨 Dallas Korean", "Korean cafe Dallas",
  "Korean bakery Carrollton", "한인 카페 달라스",
  // 미용실
  "Korean hair salon Carrollton", "한인 미용실 달라스",
  "Korean hair salon Plano", "Korean nail salon Dallas",
  "Korean beauty Carrollton", "Korean spa Dallas",
  // 교회
  "한인교회 달라스", "Korean church Dallas", "Korean church Carrollton",
  "Korean church Plano", "Korean church Frisco",
  // 자동차
  "Korean auto repair Dallas", "한인 정비소 달라스",
  "Korean auto dealer Carrollton",
  // 병원/치과
  "Korean doctor Dallas", "한인 병원 달라스", "Korean dentist Dallas",
  "Korean clinic Carrollton", "Korean doctor Plano",
  "한의원 달라스", "Korean acupuncture Dallas",
  // 법률/회계
  "Korean lawyer Dallas", "한인 변호사 달라스",
  "Korean CPA Dallas", "한인 회계사",
  "Korean attorney Plano",
  // 부동산
  "Korean realtor Dallas", "한인 부동산 달라스",
  "Korean real estate Plano", "Korean realtor Carrollton",
  // 한인마트
  "Korean market Dallas", "한인마트 달라스", "Korean grocery Carrollton",
  "H Mart Dallas", "Korean supermarket Plano",
  // 학원
  "Korean school Dallas", "Korean academy Carrollton",
  "Korean tutoring Plano", "태권도 달라스",
  // 기타
  "Korean insurance Dallas", "한인 보험",
  "Korean moving Dallas", "Korean travel agency Dallas",
  "Korean tax service Dallas",
  "Korean handyman Dallas",
  "Korean cleaning service Dallas",
  "Korean photographer Dallas",
  "Korean pet grooming Dallas"
];

// 지역 (locationBias 중심점 + 반경)
const LOCATIONS = [
  { name: "Carrollton 한인타운", lat: 32.9537, lng: -96.8903, radius: 5000 },
  { name: "Dallas Koreatown (Royal Ln)", lat: 32.8898, lng: -96.8841, radius: 5000 },
  { name: "Plano", lat: 33.0198, lng: -96.6989, radius: 10000 },
  { name: "Frisco", lat: 33.1507, lng: -96.8236, radius: 10000 },
  { name: "Irving/Las Colinas", lat: 32.8140, lng: -96.9489, radius: 8000 },
  { name: "Lewisville", lat: 33.0462, lng: -96.9942, radius: 8000 },
  { name: "Allen/McKinney", lat: 33.1032, lng: -96.6706, radius: 10000 },
  { name: "Fort Worth", lat: 32.7555, lng: -97.3308, radius: 15000 },
  { name: "Arlington", lat: 32.7357, lng: -97.1081, radius: 10000 },
  { name: "Richardson/Garland", lat: 32.9483, lng: -96.7299, radius: 8000 }
];

// 카테고리 매핑
function mapCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('restaurant') || q.includes('food') || q.includes('bbq') || q.includes('한식당') || q.includes('분식') || q.includes('치킨')) return 'restaurant';
  if (q.includes('cafe') || q.includes('카페') || q.includes('bakery')) return 'cafe';
  if (q.includes('hair') || q.includes('beauty') || q.includes('nail') || q.includes('spa') || q.includes('미용실')) return 'beauty';
  if (q.includes('church') || q.includes('교회')) return 'church';
  if (q.includes('auto') || q.includes('정비소') || q.includes('dealer')) return 'automotive';
  if (q.includes('doctor') || q.includes('clinic') || q.includes('dentist') || q.includes('병원') || q.includes('치과') || q.includes('한의원') || q.includes('acupuncture')) return 'healthcare';
  if (q.includes('lawyer') || q.includes('attorney') || q.includes('변호사')) return 'legal';
  if (q.includes('cpa') || q.includes('회계사') || q.includes('tax')) return 'accounting';
  if (q.includes('realtor') || q.includes('real estate') || q.includes('부동산')) return 'real_estate';
  if (q.includes('market') || q.includes('grocery') || q.includes('mart') || q.includes('마트') || q.includes('supermarket')) return 'grocery';
  if (q.includes('school') || q.includes('academy') || q.includes('tutoring') || q.includes('태권도') || q.includes('학원')) return 'education';
  if (q.includes('insurance') || q.includes('보험')) return 'insurance';
  if (q.includes('moving')) return 'moving';
  if (q.includes('travel')) return 'travel';
  if (q.includes('handyman')) return 'home_services';
  if (q.includes('cleaning')) return 'cleaning';
  if (q.includes('photographer')) return 'photography';
  if (q.includes('pet')) return 'pet_services';
  return 'other';
}

// 한글 체크
function hasKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
}

// City 추출
function extractCity(addressComponents) {
  if (!addressComponents) return null;
  
  for (const comp of addressComponents) {
    if (comp.types && comp.types.includes('locality')) {
      return comp.longText || comp.shortText;
    }
  }
  
  for (const comp of addressComponents) {
    if (comp.types && (comp.types.includes('sublocality') || comp.types.includes('neighborhood'))) {
      return comp.longText || comp.shortText;
    }
  }
  
  return null;
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
        languageCode: 'ko',
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

// 업체 저장
async function saveBusiness(place, category) {
  try {
    // google_place_id 추출 (places/ 접두사 제거)
    const googlePlaceId = place.id.replace('places/', '');
    
    // 이미 존재하는지 확인
    if (await isExistingPlaceId(googlePlaceId)) {
      return { status: 'duplicate', id: googlePlaceId };
    }
    
    // formattedAddress에서 TX 확인
    const address = place.formattedAddress || '';
    if (!address.includes('TX') && !address.includes('Texas')) {
      return { status: 'filtered', reason: 'not_texas' };
    }
    
    // 이름
    const name = place.displayName?.text || '';
    const nameKo = hasKorean(name) ? name : null;
    const nameEn = nameKo ? name : name; // 한글 있으면 그대로, 없으면 영어로
    
    // City 추출
    const city = extractCity(place.addressComponents);
    
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
    
    // DB 삽입
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
      city,
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
    
    return { status: 'saved', id: result.rows[0].id, name: nameKo || nameEn };
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
  console.log('🔍 DalConnect Google Places API 정밀 재스크래핑 시작\n');
  console.log(`📊 검색어: ${SEARCH_QUERIES.length}개`);
  console.log(`📍 지역: ${LOCATIONS.length}개`);
  console.log(`🎯 총 조합: ${SEARCH_QUERIES.length * LOCATIONS.length}개\n`);
  
  const stats = {
    total: 0,
    saved: 0,
    duplicate: 0,
    filtered: 0,
    error: 0
  };
  
  let combinationIndex = 0;
  const totalCombinations = SEARCH_QUERIES.length * LOCATIONS.length;
  
  for (const query of SEARCH_QUERIES) {
    const category = mapCategory(query);
    
    for (const location of LOCATIONS) {
      combinationIndex++;
      const progress = ((combinationIndex / totalCombinations) * 100).toFixed(1);
      
      console.log(`\n[${ combinationIndex}/${totalCombinations}] (${progress}%)`);
      console.log(`🔍 "${query}" @ ${location.name}`);
      console.log(`📂 카테고리: ${category}`);
      
      const places = await searchPlaces(query, location);
      console.log(`   결과: ${places.length}개`);
      
      for (const place of places) {
        stats.total++;
        const result = await saveBusiness(place, category);
        
        if (result.status === 'saved') {
          stats.saved++;
          console.log(`   ✅ 저장: ${result.name}`);
        } else if (result.status === 'duplicate') {
          stats.duplicate++;
          console.log(`   ⏭️  중복: ${result.id}`);
        } else if (result.status === 'filtered') {
          stats.filtered++;
          console.log(`   ⚠️  필터링: ${result.reason}`);
        } else if (result.status === 'error') {
          stats.error++;
          console.log(`   ❌ 에러: ${result.error}`);
        }
      }
      
      // Rate limit: 500ms 대기
      await delay(500);
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`총 발견: ${stats.total}개`);
  console.log(`✅ 신규 저장: ${stats.saved}개`);
  console.log(`⏭️  중복 스킵: ${stats.duplicate}개`);
  console.log(`⚠️  필터링: ${stats.filtered}개`);
  console.log(`❌ 에러: ${stats.error}개`);
  console.log('='.repeat(60));
  
  await pool.end();
  console.log('\n✨ 완료!');
}

main().catch(error => {
  console.error('❌ 치명적 에러:', error);
  process.exit(1);
});
