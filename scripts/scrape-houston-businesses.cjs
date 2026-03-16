require('dotenv').config();
const axios = require('axios');
const pg = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Houston 한인 업소 검색어 리스트
const HOUSTON_SEARCH_QUERIES = [
  // 식당
  "Korean restaurant Houston TX",
  "Korean BBQ Houston TX",
  "Korean food Houston Texas",
  "한식당 휴스턴",
  "Korean restaurant Sugar Land TX",
  "Korean restaurant Katy TX",
  "Korean restaurant Bellaire TX",
  "Korean restaurant The Woodlands TX",
  "Korean cafe Houston TX",
  "Korean bakery Houston",
  "Korean fried chicken Houston",
  "Korean noodles Houston",
  "Korean grill Houston",
  "Korean taco Houston",
  "Korean tofu house Houston",
  "Korean BBQ Sugar Land",
  "한식 슈거랜드",
  "Korean restaurant Pearland TX",
  "Korean restaurant Stafford TX",
  "Korean restaurant Missouri City TX",

  // 마트/식료품
  "Korean grocery Houston TX",
  "Korean market Houston TX",
  "H Mart Houston",
  "Korean supermarket Houston",
  "Korean food store Houston",
  "Korean mart Sugar Land",
  "한인 마트 휴스턴",
  "Hana World Market Houston",
  "Korean grocery Katy TX",
  "Asian grocery Houston Korean",

  // 미용/스파
  "Korean hair salon Houston TX",
  "Korean beauty Houston",
  "Korean spa Houston",
  "Korean nail salon Houston",
  "Korean hair stylist Houston",
  "Korean massage Houston",
  "한인 미용실 휴스턴",
  "Korean hair salon Sugar Land",
  "Korean hair salon Katy",
  "Korean skincare Houston",
  "Korean facial Houston",

  // 교회
  "Korean church Houston TX",
  "Korean church Sugar Land TX",
  "Korean church Katy TX",
  "Korean church The Woodlands TX",
  "한인교회 휴스턴",
  "Korean Baptist church Houston",
  "Korean Methodist church Houston",
  "Korean Presbyterian Houston",
  "Korean church Pearland TX",
  "한인교회 슈거랜드",

  // 의료/건강
  "Korean doctor Houston TX",
  "Korean dentist Houston",
  "Korean clinic Houston",
  "한의원 휴스턴",
  "Korean acupuncture Houston",
  "Korean chiropractor Houston",
  "Korean pediatrician Houston",
  "Korean dermatologist Houston",
  "Korean OB GYN Houston",
  "Korean ophthalmologist Houston",
  "Korean doctor Sugar Land",
  "Korean doctor Katy TX",
  "한인 병원 휴스턴",

  // 자동차
  "Korean auto repair Houston TX",
  "Korean mechanic Houston",
  "Korean car dealer Houston",
  "Korean auto shop Houston",
  "한인 정비소 휴스턴",
  "Korean auto Sugar Land",
  "Korean tire shop Houston",

  // 부동산
  "Korean realtor Houston TX",
  "Korean real estate Houston",
  "Korean property Houston",
  "한인 부동산 휴스턴",
  "Korean realtor Sugar Land",
  "Korean realtor Katy TX",
  "Korean mortgage Houston",

  // 법률/회계/보험
  "Korean lawyer Houston TX",
  "Korean attorney Houston",
  "Korean CPA Houston",
  "Korean accountant Houston",
  "Korean tax service Houston",
  "Korean insurance Houston",
  "한인 변호사 휴스턴",
  "한인 회계사 휴스턴",
  "Korean immigration attorney Houston",
  "Korean financial advisor Houston",

  // 교육
  "Korean academy Houston TX",
  "Korean school Houston",
  "Korean tutoring Houston",
  "Korean daycare Houston",
  "Korean music lessons Houston",
  "태권도 휴스턴",
  "Korean language school Houston",
  "Korean hagwon Houston",
  "Korean after school Houston",
  "Korean SAT prep Houston",
  "Korean taekwondo Houston",
  "Korean martial arts Houston",

  // 기타 서비스
  "Korean travel agency Houston",
  "Korean photographer Houston",
  "Korean wedding Houston",
  "Korean cleaning service Houston",
  "Korean moving company Houston",
  "Korean IT service Houston",
  "Korean computer repair Houston",
  "Korean printing Houston",
  "Korean gift shop Houston",
  "Korean bookstore Houston"
];

// Houston 지역 (한인 밀집 지역 중심)
const HOUSTON_LOCATIONS = [
  // Blalock / Long Point — 전통 한인타운
  { name: "Blalock Korean Town", lat: 29.7746, lng: -95.5418, radius: 5000 },

  // Sugar Land — 최대 한인 밀집 지역
  { name: "Sugar Land Central", lat: 29.6196, lng: -95.6349, radius: 8000 },
  { name: "Sugar Land East", lat: 29.6350, lng: -95.5700, radius: 6000 },
  { name: "Sugar Land West", lat: 29.6000, lng: -95.7000, radius: 6000 },

  // Katy — 빠르게 성장하는 한인 커뮤니티
  { name: "Katy Central", lat: 29.7858, lng: -95.8245, radius: 8000 },
  { name: "Katy East", lat: 29.7700, lng: -95.7500, radius: 6000 },

  // Bellaire — 한인 상권 밀집
  { name: "Bellaire", lat: 29.7058, lng: -95.4586, radius: 5000 },

  // Memorial / Energy Corridor
  { name: "Memorial Houston", lat: 29.7620, lng: -95.5600, radius: 6000 },

  // The Woodlands — 북쪽 한인 커뮤니티
  { name: "The Woodlands", lat: 30.1658, lng: -95.4613, radius: 8000 },
  { name: "Spring TX", lat: 30.0799, lng: -95.4172, radius: 6000 },

  // Pearland / Friendswood
  { name: "Pearland", lat: 29.5636, lng: -95.2860, radius: 8000 },

  // Stafford / Missouri City
  { name: "Stafford", lat: 29.6174, lng: -95.5566, radius: 6000 },
  { name: "Missouri City", lat: 29.6185, lng: -95.5377, radius: 6000 },

  // Houston 중심부 / Galleria
  { name: "Galleria Houston", lat: 29.7372, lng: -95.4614, radius: 5000 },
  { name: "Houston Downtown", lat: 29.7604, lng: -95.3698, radius: 5000 },

  // Southwest Houston
  { name: "Southwest Houston", lat: 29.6800, lng: -95.5300, radius: 7000 },

  // Cypress / Northwest
  { name: "Cypress TX", lat: 29.9691, lng: -95.6974, radius: 7000 }
];

// 카테고리 매핑 (Austin과 동일)
function mapCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('restaurant') || q.includes('food') || q.includes('bbq') || q.includes('한식당') || q.includes('grill') || q.includes('chicken') || q.includes('noodles') || q.includes('taco') || q.includes('tofu')) return 'restaurant';
  if (q.includes('cafe') || q.includes('카페') || q.includes('bakery')) return 'cafe';
  if (q.includes('hair') || q.includes('beauty') || q.includes('nail') || q.includes('spa') || q.includes('미용실') || q.includes('massage') || q.includes('stylist') || q.includes('skincare') || q.includes('facial')) return 'beauty';
  if (q.includes('church') || q.includes('교회') || q.includes('baptist') || q.includes('methodist') || q.includes('presbyterian')) return 'church';
  if (q.includes('auto') || q.includes('정비소') || q.includes('dealer') || q.includes('mechanic') || q.includes('car') || q.includes('tire')) return 'automotive';
  if (q.includes('doctor') || q.includes('clinic') || q.includes('dentist') || q.includes('병원') || q.includes('치과') || q.includes('한의원') || q.includes('acupuncture') || q.includes('chiropractor') || q.includes('pediatrician') || q.includes('dermatologist') || q.includes('ob gyn') || q.includes('ophthalmologist')) return 'healthcare';
  if (q.includes('lawyer') || q.includes('attorney') || q.includes('변호사') || q.includes('immigration')) return 'legal';
  if (q.includes('cpa') || q.includes('회계사') || q.includes('tax') || q.includes('accountant') || q.includes('financial')) return 'accounting';
  if (q.includes('realtor') || q.includes('real estate') || q.includes('부동산') || q.includes('property') || q.includes('mortgage')) return 'real_estate';
  if (q.includes('market') || q.includes('grocery') || q.includes('mart') || q.includes('마트') || q.includes('supermarket') || q.includes('store')) return 'grocery';
  if (q.includes('school') || q.includes('academy') || q.includes('tutoring') || q.includes('태권도') || q.includes('학원') || q.includes('daycare') || q.includes('lessons') || q.includes('language') || q.includes('hagwon') || q.includes('after school') || q.includes('sat') || q.includes('taekwondo') || q.includes('martial')) return 'education';
  if (q.includes('insurance') || q.includes('보험')) return 'insurance';
  if (q.includes('travel') || q.includes('agency')) return 'travel';
  if (q.includes('photographer') || q.includes('wedding')) return 'photography';
  if (q.includes('cleaning') || q.includes('moving') || q.includes('handyman') || q.includes('computer') || q.includes('it') || q.includes('printing') || q.includes('gift') || q.includes('bookstore')) return 'other';
  return 'other';
}

// 한글 체크
function hasKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
}

// City 추출 (Houston 지역 체크)
function extractCity(addressComponents, formattedAddress) {
  if (!addressComponents) return 'Houston';

  const houstonKeywords = [
    'houston', 'sugar land', 'katy', 'bellaire', 'the woodlands', 'woodlands',
    'spring', 'pearland', 'stafford', 'missouri city', 'friendswood',
    'cypress', 'tomball', 'conroe', 'league city', 'galveston',
    'richmond', 'rosenberg', 'fulshear'
  ];
  const address = (formattedAddress || '').toLowerCase();

  for (const keyword of houstonKeywords) {
    if (address.includes(keyword)) {
      return keyword.replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  for (const comp of addressComponents) {
    if (comp.types && comp.types.includes('locality')) {
      const city = comp.longText || comp.shortText;
      if (houstonKeywords.includes(city.toLowerCase())) {
        return city;
      }
    }
  }

  return 'Houston';
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
    if (error.response?.status === 404) return [];
    console.error(`   ❌ API 에러 (${error.response?.status}):`, error.response?.data?.error?.message || error.message);
    return [];
  }
}

// 업체 저장 (Houston 전용)
async function saveBusiness(place, category) {
  try {
    const googlePlaceId = place.id.replace('places/', '');

    if (await isExistingPlaceId(googlePlaceId)) {
      return { status: 'duplicate', id: googlePlaceId };
    }

    const address = place.formattedAddress || '';
    if (!address.includes('TX') && !address.includes('Texas')) {
      return { status: 'filtered', reason: 'not_texas' };
    }

    // Houston 지역 필터
    const houstonKeywords = [
      'houston', 'sugar land', 'katy', 'bellaire', 'woodlands',
      'spring', 'pearland', 'stafford', 'missouri city', 'friendswood',
      'cypress', 'tomball', 'conroe', 'league city', 'richmond',
      'rosenberg', 'fulshear', 'galveston'
    ];
    const hasHoustonKeyword = houstonKeywords.some(k => address.toLowerCase().includes(k));

    if (!hasHoustonKeyword) {
      return { status: 'filtered', reason: 'not_houston_area' };
    }

    const name = place.displayName?.text || '';
    const nameKo = hasKorean(name) ? name : null;
    const nameEn = name;

    const isKoreanBusiness = hasKorean(name) ||
      name.toLowerCase().includes('korean') ||
      name.toLowerCase().includes('korea') ||
      (place.websiteUri && (place.websiteUri.includes('korea') || hasKorean(place.websiteUri)));

    if (!isKoreanBusiness) {
      return { status: 'filtered', reason: 'not_korean_business' };
    }

    const city = extractCity(place.addressComponents, address);

    let coverUrl = null;
    let photos = [];
    if (place.photos && place.photos.length > 0) {
      coverUrl = getPhotoUrl(place.photos[0].name);
      photos = place.photos.slice(0, 6).map(p => getPhotoUrl(p.name));
    }

    let hours = null;
    if (place.regularOpeningHours?.weekdayDescriptions) {
      hours = {};
      place.regularOpeningHours.weekdayDescriptions.forEach(desc => {
        const [day, ...timeParts] = desc.split(': ');
        hours[day] = timeParts.join(': ');
      });
    }

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
      city, // Sugar Land, Katy, Houston 등 실제 도시명
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 Houston 한인 업소 Google Places API 스크래핑 시작\n');
  console.log(`📊 검색어: ${HOUSTON_SEARCH_QUERIES.length}개`);
  console.log(`📍 지역: ${HOUSTON_LOCATIONS.length}개`);
  console.log(`🎯 총 조합: ${HOUSTON_SEARCH_QUERIES.length * HOUSTON_LOCATIONS.length}개\n`);

  const stats = { total: 0, saved: 0, duplicate: 0, filtered: 0, error: 0 };
  const filterReasons = {};

  let combinationIndex = 0;
  const totalCombinations = HOUSTON_SEARCH_QUERIES.length * HOUSTON_LOCATIONS.length;

  for (const query of HOUSTON_SEARCH_QUERIES) {
    const category = mapCategory(query);

    for (const location of HOUSTON_LOCATIONS) {
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
        } else if (result.status === 'filtered') {
          stats.filtered++;
          filterReasons[result.reason] = (filterReasons[result.reason] || 0) + 1;
        } else if (result.status === 'error') {
          stats.error++;
        }
      }

      // Rate limit
      await delay(1000);
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📊 Houston 한인 업소 스크래핑 최종 통계');
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

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE city ILIKE ANY(ARRAY['houston','sugar land','katy','bellaire','pearland','stafford','spring','woodlands','cypress','missouri city'])"
    );
    console.log(`\n🏢 총 Houston 업소 수: ${result.rows[0].count}개`);
  } catch (error) {
    console.error('업소 수 조회 에러:', error.message);
  }

  await pool.end();
  console.log('\n✨ Houston 스크래핑 완료!');
}

main().catch(error => {
  console.error('❌ 치명적 에러:', error);
  process.exit(1);
});
