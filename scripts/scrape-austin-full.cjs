require('dotenv').config();
const axios = require('axios');
const pg = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const API_KEY = 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 핵심 Austin 한인 업소 검색어 (API 한도 고려하여 선별)
const AUSTIN_SEARCH_QUERIES = [
  // 식당 (가장 중요)
  "Korean restaurant Austin TX", 
  "Korean BBQ Austin TX",
  "Korean food Austin Texas",
  "Korean restaurant Round Rock TX",
  "Korean restaurant North Austin",
  "Korean fried chicken Austin",
  "Korean noodles Austin",
  "Korean grill Austin",
  "Korean tofu house Austin",
  "Korean soup Austin",
  
  // 마트/식료품
  "Korean grocery Austin TX",
  "Korean market Austin TX", 
  "H Mart Austin",
  "Korean supermarket Austin",
  "Korean food store Austin",
  "Korean mart Round Rock",
  "Asian grocery Austin Korean",
  "Korean convenience store Austin",
  
  // 미용/스파
  "Korean hair salon Austin TX",
  "Korean beauty Austin",
  "Korean spa Austin",
  "Korean nail salon Austin",
  "Korean hair stylist Austin",
  "Korean massage Austin",
  
  // 교회
  "Korean church Austin TX",
  "Korean church Round Rock",
  "Korean church Cedar Park",
  "Korean Baptist church Austin",
  "Korean Methodist church Austin",
  "Korean Presbyterian Austin",
  "Korean Catholic church Austin",
  
  // 의료/건강
  "Korean doctor Austin TX",
  "Korean dentist Austin",
  "Korean clinic Austin",
  "Korean acupuncture Austin",
  "Korean chiropractor Austin",
  
  // 자동차
  "Korean auto repair Austin TX",
  "Korean mechanic Austin",
  "Korean car dealer Austin",
  
  // 부동산
  "Korean realtor Austin TX",
  "Korean real estate Austin",
  
  // 법률/회계
  "Korean lawyer Austin TX",
  "Korean attorney Austin",
  "Korean CPA Austin",
  "Korean accountant Austin",
  "Korean tax service Austin",
  
  // 교육
  "Korean academy Austin TX",
  "Korean school Austin",
  "Korean tutoring Austin",
  "Korean daycare Austin",
  "Korean music lessons Austin",
  
  // 기타 서비스
  "Korean travel agency Austin",
  "Korean photographer Austin",
  "Korean cleaning service Austin",
  "Korean moving company Austin",
  "Korean IT service Austin"
];

// Austin 주요 지역들
const AUSTIN_LOCATIONS = [
  { name: "Austin Center", lat: 30.2672, lng: -97.7431, radius: 12000 },
  { name: "North Austin", lat: 30.3669, lng: -97.7428, radius: 10000 },
  { name: "Round Rock", lat: 30.5083, lng: -97.6789, radius: 10000 },
  { name: "Cedar Park", lat: 30.5052, lng: -97.8203, radius: 8000 },
  { name: "Pflugerville", lat: 30.4394, lng: -97.6200, radius: 8000 }
];

// 카테고리 매핑
function mapCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('restaurant') || q.includes('food') || q.includes('bbq') || q.includes('grill') || q.includes('chicken') || q.includes('noodles') || q.includes('tofu') || q.includes('soup')) return 'restaurant';
  if (q.includes('cafe') || q.includes('bakery')) return 'cafe';
  if (q.includes('hair') || q.includes('beauty') || q.includes('nail') || q.includes('spa') || q.includes('massage') || q.includes('stylist')) return 'beauty';
  if (q.includes('church') || q.includes('baptist') || q.includes('methodist') || q.includes('presbyterian') || q.includes('catholic')) return 'church';
  if (q.includes('auto') || q.includes('dealer') || q.includes('mechanic') || q.includes('car')) return 'automotive';
  if (q.includes('doctor') || q.includes('clinic') || q.includes('dentist') || q.includes('acupuncture') || q.includes('chiropractor')) return 'healthcare';
  if (q.includes('lawyer') || q.includes('attorney')) return 'legal';
  if (q.includes('cpa') || q.includes('tax') || q.includes('accountant')) return 'accounting';
  if (q.includes('realtor') || q.includes('real estate')) return 'real_estate';
  if (q.includes('market') || q.includes('grocery') || q.includes('mart') || q.includes('supermarket') || q.includes('store') || q.includes('convenience')) return 'grocery';
  if (q.includes('school') || q.includes('academy') || q.includes('tutoring') || q.includes('daycare') || q.includes('lessons')) return 'education';
  if (q.includes('travel') || q.includes('agency')) return 'travel';
  if (q.includes('photographer')) return 'photography';
  if (q.includes('cleaning') || q.includes('moving') || q.includes('it')) return 'home_services';
  return 'other';
}

// 한글 체크
function hasKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
}

// City 추출 (Austin 지역 체크)
function extractCity(addressComponents, formattedAddress) {
  const austinKeywords = ['austin', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'leander'];
  const address = (formattedAddress || '').toLowerCase();
  
  for (const keyword of austinKeywords) {
    if (address.includes(keyword)) {
      return keyword.replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  if (addressComponents) {
    for (const comp of addressComponents) {
      if (comp.types && comp.types.includes('locality')) {
        const city = comp.longText || comp.shortText;
        if (austinKeywords.includes(city.toLowerCase())) {
          return city;
        }
      }
    }
  }
  
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
    return [];
  }
}

// 업체 저장
async function saveBusiness(place, category) {
  try {
    const googlePlaceId = place.id.replace('places/', '');
    const name = place.displayName?.text || '';
    const address = place.formattedAddress || '';
    
    // 중복 체크
    if (await isExistingPlaceId(googlePlaceId)) {
      return { status: 'duplicate', name };
    }
    
    // Texas 확인
    if (!address.includes('TX') && !address.includes('Texas')) {
      return { status: 'filtered', reason: 'not_texas', name };
    }
    
    // Austin 지역 확인
    const austinKeywords = ['austin', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'leander'];
    const hasAustinKeyword = austinKeywords.some(keyword => 
      address.toLowerCase().includes(keyword)
    );
    
    if (!hasAustinKeyword) {
      return { status: 'filtered', reason: 'not_austin_area', name };
    }
    
    // 한국 업소 여부 확인
    const isKoreanBusiness = hasKorean(name) || 
      name.toLowerCase().includes('korean') || 
      name.toLowerCase().includes('korea') ||
      name.toLowerCase().includes('h mart') ||
      name.toLowerCase().includes('seoul') ||
      name.toLowerCase().includes('김치') ||
      name.toLowerCase().includes('불고기') ||
      (place.websiteUri && (place.websiteUri.includes('korea') || hasKorean(place.websiteUri)));
    
    if (!isKoreanBusiness) {
      return { status: 'filtered', reason: 'not_korean_business', name };
    }
    
    const nameKo = hasKorean(name) ? name : null;
    const nameEn = nameKo ? name : name;
    const actualCity = extractCity(place.addressComponents, address);
    
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
    
    // DB 삽입 (city를 'austin'으로 통일)
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
      'austin', // 모든 Austin 지역 업소는 'austin'으로 저장
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
    
    return { 
      status: 'saved', 
      id: result.rows[0].id, 
      name: nameKo || nameEn, 
      actualCity 
    };
  } catch (error) {
    return { status: 'error', error: error.message, name: place.displayName?.text };
  }
}

// 딜레이
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인
async function main() {
  console.log('🔍 Austin 한인 업소 전체 스크래핑 시작\n');
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
  let savedBusinesses = [];
  
  let combinationIndex = 0;
  const totalCombinations = AUSTIN_SEARCH_QUERIES.length * AUSTIN_LOCATIONS.length;
  
  for (const query of AUSTIN_SEARCH_QUERIES) {
    const category = mapCategory(query);
    
    for (const location of AUSTIN_LOCATIONS) {
      combinationIndex++;
      const progress = ((combinationIndex / totalCombinations) * 100).toFixed(1);
      
      console.log(`\n[${combinationIndex}/${totalCombinations}] (${progress}%)`);
      console.log(`🔍 "${query}" @ ${location.name}`);
      
      const places = await searchPlaces(query, location);
      console.log(`   결과: ${places.length}개`);
      
      for (const place of places) {
        stats.total++;
        const result = await saveBusiness(place, category);
        
        if (result.status === 'saved') {
          stats.saved++;
          savedBusinesses.push(result);
          console.log(`   ✅ 저장: ${result.name} (${result.actualCity})`);
        } else if (result.status === 'duplicate') {
          stats.duplicate++;
          console.log(`   ⏭️  중복: ${result.name}`);
        } else if (result.status === 'filtered') {
          stats.filtered++;
          filterReasons[result.reason] = (filterReasons[result.reason] || 0) + 1;
        } else if (result.status === 'error') {
          stats.error++;
          console.log(`   ❌ 에러: ${result.name}`);
        }
      }
      
      // Rate limit: 800ms 대기
      await delay(800);
    }
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 Austin 한인 업소 스크래핑 최종 결과');
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
  
  console.log('\n🎯 새로 추가된 Austin 업소들:');
  savedBusinesses.forEach((business, index) => {
    console.log(`${index + 1}. ${business.name} (${business.actualCity})`);
  });
  
  // 최종 Austin 업소 수 확인
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE city = 'austin'"
    );
    console.log(`\n🏢 총 Austin 업소 수: ${result.rows[0].count}개`);
  } catch (error) {
    console.error('업소 수 조회 에러:', error.message);
  }
  
  console.log('='.repeat(80));
  
  await pool.end();
  console.log('\n✨ Austin 스크래핑 완료!');
}

main().catch(error => {
  console.error('❌ 치명적 에러:', error);
  process.exit(1);
});