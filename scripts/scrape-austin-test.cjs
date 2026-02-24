require('dotenv').config();
const axios = require('axios');
const pg = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const API_KEY = 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 테스트용 간단한 검색어들
const TEST_QUERIES = [
  "Korean restaurant Austin TX", 
  "Korean BBQ Austin TX",
  "Korean grocery Austin TX",
  "Korean church Austin TX",
  "H Mart Austin"
];

// Austin 중심
const AUSTIN_CENTER = { name: "Austin Center", lat: 30.2672, lng: -97.7431, radius: 15000 };

// 카테고리 매핑
function mapCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('restaurant') || q.includes('bbq')) return 'restaurant';
  if (q.includes('grocery') || q.includes('mart')) return 'grocery';
  if (q.includes('church')) return 'church';
  return 'other';
}

// 한글 체크
function hasKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
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
    console.log(`   🔍 API 호출: "${query}"`);
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
    
    console.log(`   ✅ API 응답: ${response.data.places?.length || 0}개 결과`);
    return response.data.places || [];
  } catch (error) {
    console.error(`   ❌ API 에러 (${error.response?.status}):`, error.response?.data?.error?.message || error.message);
    return [];
  }
}

// 업체 저장
async function saveBusiness(place, category) {
  try {
    const googlePlaceId = place.id.replace('places/', '');
    const name = place.displayName?.text || '';
    const address = place.formattedAddress || '';
    
    console.log(`   📍 처리중: ${name} (${address})`);
    
    // 이미 존재하는지 확인
    if (await isExistingPlaceId(googlePlaceId)) {
      return { status: 'duplicate', id: googlePlaceId, name };
    }
    
    // Texas 확인
    if (!address.includes('TX') && !address.includes('Texas')) {
      return { status: 'filtered', reason: 'not_texas', name };
    }
    
    // Austin 지역 확인
    const austinKeywords = ['austin', 'round rock', 'cedar park', 'pflugerville'];
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
      (place.websiteUri && (place.websiteUri.includes('korea') || hasKorean(place.websiteUri)));
    
    if (!isKoreanBusiness) {
      return { status: 'filtered', reason: 'not_korean_business', name };
    }
    
    const nameKo = hasKorean(name) ? name : null;
    const nameEn = nameKo ? name : name;
    
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
      'austin',
      place.nationalPhoneNumber || null,
      place.websiteUri || null,
      hours ? JSON.stringify(hours) : null,
      coverUrl,
      photos.length > 0 ? JSON.stringify(photos) : null,
      place.rating || 0,
      place.userRatingCount || 0,
      googlePlaceId
    ];
    
    console.log(`   💾 DB 저장 시도...`);
    const result = await pool.query(query, values);
    
    return { status: 'saved', id: result.rows[0].id, name: nameKo || nameEn };
  } catch (error) {
    console.error('   ❌ 저장 에러:', error.message);
    return { status: 'error', error: error.message, name: place.displayName?.text };
  }
}

// 메인
async function main() {
  console.log('🧪 Austin 한인 업소 테스트 스크래핑 시작\n');
  console.log(`📊 테스트 검색어: ${TEST_QUERIES.length}개\n`);
  
  // DB 연결 테스트
  try {
    console.log('🔌 데이터베이스 연결 테스트...');
    await pool.query('SELECT NOW()');
    console.log('✅ 데이터베이스 연결 성공!\n');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    return;
  }
  
  const stats = {
    total: 0,
    saved: 0,
    duplicate: 0,
    filtered: 0,
    error: 0
  };
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    const category = mapCategory(query);
    
    console.log(`\n[${i + 1}/${TEST_QUERIES.length}] 검색: "${query}"`);
    console.log(`📂 카테고리: ${category}`);
    
    const places = await searchPlaces(query, AUSTIN_CENTER);
    
    for (const place of places) {
      stats.total++;
      const result = await saveBusiness(place, category);
      
      if (result.status === 'saved') {
        stats.saved++;
        console.log(`   ✅ 저장 성공: ${result.name}`);
      } else if (result.status === 'duplicate') {
        stats.duplicate++;
        console.log(`   ⏭️  중복 스킵: ${result.name}`);
      } else if (result.status === 'filtered') {
        stats.filtered++;
        console.log(`   ⚠️  필터링 (${result.reason}): ${result.name}`);
      } else if (result.status === 'error') {
        stats.error++;
        console.log(`   ❌ 에러: ${result.name} - ${result.error}`);
      }
    }
    
    // 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 스크래핑 결과');
  console.log('='.repeat(60));
  console.log(`총 발견: ${stats.total}개`);
  console.log(`✅ 신규 저장: ${stats.saved}개`);
  console.log(`⏭️  중복 스킵: ${stats.duplicate}개`);
  console.log(`⚠️  필터링: ${stats.filtered}개`);
  console.log(`❌ 에러: ${stats.error}개`);
  
  // Austin 업소 수 확인
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE city = 'austin'"
    );
    console.log(`\n🏢 총 Austin 업소 수: ${result.rows[0].count}개`);
  } catch (error) {
    console.error('업소 수 조회 에러:', error.message);
  }
  
  await pool.end();
  console.log('\n✨ 테스트 완료!');
}

main().catch(error => {
  console.error('❌ 치명적 에러:', error);
  process.exit(1);
});