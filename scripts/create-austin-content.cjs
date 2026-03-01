require('dotenv').config();
const pg = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Austin 뉴스 데이터
const AUSTIN_NEWS = [
  {
    title: "오스틴 한인 커뮤니티, 2024년 추석 행사 성황리 개최",
    url: "https://austinkorean.com/news/chuseok-festival-2024",
    content: "오스틴 한인회 주최로 진행된 추석 행사가 9월 둘째 주 주말 Cedar Park Events Center에서 열렸다. 300여 명의 한인 가족이 참석하여 전통 한복 입기, 윷놀이, 송편 만들기 등 다양한 프로그램을 즐겼다. 이번 행사는 오스틴 지역 한인 2세들에게 한국 전통문화를 체험할 수 있는 소중한 기회가 되었다.",
    category: "community",
    source: "오스틴 한인 뉴스",
    thumbnail_url: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=400",
    published_date: "2024-09-20"
  },
  {
    title: "Round Rock H Mart 오픈 1주년 기념 할인 행사",
    url: "https://hmart.com/austin-anniversary",
    content: "Round Rock에 위치한 H Mart Austin점이 오픈 1주년을 맞아 특별 할인 행사를 진행한다. 9월 한 달간 한국 식품, 화장품, 생필품 등이 최대 30% 할인되며, 주말에는 떡볶이, 김밥 등 한국 음식 시식 코너도 운영된다. H Mart 관계자는 '오스틴 한인 커뮤니티의 사랑에 보답하기 위한 행사'라고 밝혔다.",
    category: "business",
    source: "오스틴 코리아 타임즈",
    thumbnail_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400",
    published_date: "2024-09-15"
  },
  {
    title: "오스틴 대학교 한국학과, 새 학기 한국어 수업 확대",
    url: "https://utexas.edu/korean-studies-expansion",
    content: "텍사스 대학교 오스틴 캠퍼스 한국학과가 2024년 가을학기부터 한국어 수업을 대폭 확대한다고 발표했다. 기존 초급, 중급에서 고급, 비즈니스 한국어, 한국 현대문학 강의까지 총 8개 과목으로 늘어났다. 한국어 수업 수강 신청자 수가 3년간 200% 증가한 것이 확대 배경이다.",
    category: "education",
    source: "UT 데일리 텍산",
    thumbnail_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400",
    published_date: "2024-08-28"
  },
  {
    title: "오스틴 한인 의료진 모임 'KAMA-Austin' 정식 출범",
    url: "https://kama-austin.org/launch",
    content: "오스틴 지역 한인 의료진들이 모여 'Korean American Medical Association Austin Chapter'를 정식으로 출범했다. 내과, 치과, 한의학 등 20여 명의 의료진이 참여하여 오스틴 한인 커뮤니티 의료 서비스 향상과 의료진 간 네트워킹을 목표로 한다. 매월 첫째 주 토요일 정기 모임을 갖는다.",
    category: "health",
    source: "오스틴 한인 뉴스",
    thumbnail_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    published_date: "2024-09-05"
  },
  {
    title: "Cedar Park Korean Presbyterian Church 새 교회 건물 기공식",
    url: "https://cpkpc.org/groundbreaking-ceremony",
    content: "Cedar Park Korean Presbyterian Church가 새 교회 건물 기공식을 거행했다. 기존 건물의 2배 크기인 새 교회는 800명 수용 가능한 대예배실과 한글학교 전용 교실 10개를 갖추게 된다. 완공 예정일은 2025년 여름이며, 건축비 일부는 오스틴 한인 비즈니스 후원으로 충당된다.",
    category: "community", 
    source: "오스틴 크리스찬 타임즈",
    thumbnail_url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=400",
    published_date: "2024-09-10"
  },
  {
    title: "오스틴 한국 문화원, K-Pop 댄스 클래스 신설",
    url: "https://austinkoreanculture.org/kpop-dance",
    content: "오스틴 한국 문화원이 청소년과 성인을 대상으로 K-Pop 댄스 클래스를 신설한다고 발표했다. BTS, 블랙핑크, 스트레이 키즈 등 인기 K-Pop 그룹의 안무를 배울 수 있으며, 경험 있는 한인 강사진이 지도한다. 수업은 매주 토요일 오후에 진행되며, 3개월 과정으로 운영된다.",
    category: "culture",
    source: "오스틴 문화 뉴스",
    thumbnail_url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400",
    published_date: "2024-09-01"
  },
  {
    title: "오스틴 한인 부동산 시장 활황, 한인 리얼터 급증",
    url: "https://austinrealtor.com/korean-market-boom",
    content: "최근 2년간 오스틴 지역으로 이주하는 한인 가정이 급증하면서 한인 부동산 전문 리얼터 수도 늘어나고 있다. 삼성 오스틴 반도체 공장 확장과 IT 기업 입주로 인한 한인 엔지니어 유입이 주요 원인이다. 현재 오스틴 지역에서 활동하는 한인 리얼터는 15명으로 3년 전 5명에서 3배 증가했다.",
    category: "business",
    source: "오스틴 부동산 뉴스",
    thumbnail_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
    published_date: "2024-08-20"
  },
  {
    title: "오스틴 한인 청년회, 코딩 부트캠프 무료 운영",
    url: "https://austinkoreanyouth.org/coding-bootcamp",
    content: "오스틴 한인 청년회가 한인 2세 대학생들을 위한 무료 코딩 부트캠프를 운영한다. Python, JavaScript, 웹 개발 등을 4주간 집중 교육하며, 현지 IT 기업 재직 한인 엔지니어들이 강사로 나선다. 수료생에게는 취업 연계 서비스도 제공한다. 11월부터 시작되며 20명 선착순 모집한다.",
    category: "education",
    source: "오스틴 청년 뉴스", 
    thumbnail_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
    published_date: "2024-10-01"
  }
];

// Austin 커뮤니티 포스트 데이터
const AUSTIN_COMMUNITY_POSTS = [
  {
    nickname: "오스틴맘",
    title: "Round Rock 지역 좋은 한국 유치원 추천해 주세요",
    content: "안녕하세요! 내년에 4살 아이를 유치원에 보내려고 하는데 Round Rock 근처에 한국어도 가르치는 좋은 유치원이 있을까요? 경험 있으신 분들 조언 부탁드립니다. 🙏",
    category: "육아",
    tags: ["유치원", "Round Rock", "한국어교육", "추천"]
  },
  {
    nickname: "테크워커",
    title: "오스틴 IT 업계 한인 모임이 있나요?",
    content: "최근에 실리콘밸리에서 오스틴으로 이직했습니다. 오스틴에도 한인 개발자나 IT 업계 분들 모임이 있는지 궁금해요. 네트워킹도 하고 정보 공유도 하고 싶습니다. 알고 계신 분 있으시면 댓글 부탁드려요!",
    category: "직업/취업",
    tags: ["IT", "개발자", "모임", "네트워킹"]
  },
  {
    nickname: "음식탐험가",
    title: "오스틴에서 제일 맛있는 한국 BBQ 집은?",
    content: "친구가 놀러와서 맛있는 한국 BBQ를 대접하고 싶은데 추천 부탁드립니다! 고기 질이 좋고 반찬도 맛있는 곳으로요. 가격은 상관없어요. 댓글로 추천해 주세요! 🥩",
    category: "맛집",
    tags: ["한국BBQ", "고기집", "추천", "맛집"]
  },
  {
    nickname: "새내기",
    title: "UT 새내기 한인학생회 가입 문의",
    content: "UT 신입생인데 한인학생회(KSA) 가입하고 싶어요. 어떻게 연락하면 될까요? 활동 내용도 궁금하고요. 한인 친구들 만나고 싶습니다 😊",
    category: "학교",
    tags: ["UT", "한인학생회", "신입생", "KSA"]
  },
  {
    nickname: "Austin_리얼터",
    title: "오스틴 집 구매 시 알아두면 좋은 팁들",
    content: "부동산 일 하면서 한인분들이 자주 물어보시는 내용들 정리해봤어요.\n\n1. Property Tax 꼭 확인하세요\n2. HOA 비용도 미리 알아보기\n3. 플로리다와 다르게 여기는 추운 겨울 대비 난방비 고려\n4. 한인마트(H Mart) 접근성도 중요한 요소\n\n더 궁금한 것 있으시면 댓글 달아주세요!",
    category: "부동산",
    tags: ["부동산", "집구매", "팁", "오스틴"]
  }
];

// Austin 딜/쿠폰 데이터  
const AUSTIN_DEALS = [
  {
    title: "H Mart Austin - 추석 특가 세일",
    description: "한국 전통 식품 최대 40% 할인! 송편, 나물, 과일 등 추석 제수용품 특가 판매",
    business_name: "H Mart Austin",
    discount_percent: 40,
    valid_until: "2024-09-30",
    category: "식료품",
    location: "Round Rock"
  },
  {
    title: "Seoul Kitchen - 런치 스페셜 $12.99",
    description: "월~금 오전 11시-오후 3시 불고기 정식, 비빔밥, 김치찌개 중 선택 + 반찬 무제한",
    business_name: "Seoul Kitchen",
    discount_percent: 25,
    valid_until: "2024-12-31", 
    category: "한식당",
    location: "North Austin"
  },
  {
    title: "Beautiful Hair Salon - 신규 고객 30% 할인",
    description: "오스틴 최고의 한인 미용실! 컷+펌 신규고객 30% 할인 (예약 필수)",
    business_name: "Beautiful Hair Salon",
    discount_percent: 30,
    valid_until: "2024-11-30",
    category: "미용/뷰티", 
    location: "Central Austin"
  },
  {
    title: "Dr. Kim Family Dentistry - 첫 방문 무료 검진",
    description: "한국어 진료 가능! 첫 방문 시 구강검진 + X-ray 무료 (보험 적용 시)",
    business_name: "Dr. Kim Family Dentistry",
    discount_percent: 100,
    valid_until: "2024-12-31",
    category: "의료/치과",
    location: "Round Rock"
  },
  {
    title: "Austin Korean Church - 한글학교 등록비 할인",
    description: "2024년 가을학기 한글학교 형제자매 등록 시 둘째부터 50% 할인",
    business_name: "Austin Korean Presbyterian Church", 
    discount_percent: 50,
    valid_until: "2024-10-15",
    category: "교육",
    location: "Austin"
  },
  {
    title: "Kim's Auto Repair - 정기점검 $50",
    description: "한인 정비소! 엔진오일 교환 + 20항목 점검 패키지 특가 (보통 $80)",
    business_name: "Kim's Auto Repair",
    discount_percent: 37,
    valid_until: "2024-11-15",
    category: "자동차",
    location: "North Austin"
  },
  {
    title: "Tofu House Restaurant - 순두부찌개 $2 할인",
    description: "인기 메뉴 순두부찌개 $2 할인! 맵기 단계 선택 가능, 반찬 리필 무료",
    business_name: "Tofu House Restaurant",
    discount_percent: 15,
    valid_until: "2024-10-31",
    category: "한식당", 
    location: "South Austin"
  },
  {
    title: "Grace Academy - 겨울방학 특별반 얼리버드",
    description: "SAT/ACT 준비반, 수학 특강 등 겨울방학 프로그램 조기등록 20% 할인",
    business_name: "Grace Academy",
    discount_percent: 20,
    valid_until: "2024-11-30",
    category: "교육",
    location: "Cedar Park"
  },
  {
    title: "Seoul Spa & Massage - 커플 마사지 패키지",
    description: "60분 커플 마사지 + 사우나 이용권 특가! 평일 한정 특별 가격",
    business_name: "Seoul Spa & Massage",
    discount_percent: 25,
    valid_until: "2024-10-31",
    category: "스파/마사지",
    location: "Austin"
  },
  {
    title: "K-Beauty Store - 한국 화장품 세트 할인",
    description: "인기 K-뷰티 브랜드 3개 구매 시 1개 무료! 스킨케어, 메이크업 제품 대상",
    business_name: "K-Beauty Store",
    discount_percent: 25, 
    valid_until: "2024-11-15",
    category: "화장품/뷰티",
    location: "Round Rock"
  },
  {
    title: "Arirang Market - 김치 담그기 재료 세트",
    description: "배추, 고춧가루, 젓갈 등 김치 재료 한 세트로 특가 판매! 레시피 포함",
    business_name: "Arirang Market",
    discount_percent: 20,
    valid_until: "2024-10-15", 
    category: "식료품",
    location: "Austin"
  },
  {
    title: "Austin Korean Realtor - 첫 거래 수수료 할인",
    description: "한국어 부동산 서비스! 첫 집 구매/판매 시 중개 수수료 0.5% 할인",
    business_name: "Austin Korean Realty",
    discount_percent: 15,
    valid_until: "2024-12-31",
    category: "부동산", 
    location: "Austin"
  }
];

// 뉴스 삽입 함수
async function insertNews() {
  console.log('📰 Austin 뉴스 삽입 중...');
  
  for (const newsItem of AUSTIN_NEWS) {
    try {
      await pool.query(`
        INSERT INTO news (
          title, url, content, category, source, 
          thumbnail_url, published_date, city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (url) DO NOTHING
      `, [
        newsItem.title,
        newsItem.url, 
        newsItem.content,
        newsItem.category,
        newsItem.source,
        newsItem.thumbnail_url,
        newsItem.published_date,
        'austin'
      ]);
      
      console.log(`   ✅ ${newsItem.title}`);
    } catch (error) {
      console.log(`   ❌ ${newsItem.title}: ${error.message}`);
    }
  }
}

// 커뮤니티 포스트 삽입 함수
async function insertCommunityPosts() {
  console.log('\n💬 Austin 커뮤니티 포스트 삽입 중...');
  
  for (const post of AUSTIN_COMMUNITY_POSTS) {
    try {
      // 간단한 패스워드 해시 (실제로는 bcrypt 사용 권장)
      const passwordHash = 'austin123';
      
      await pool.query(`
        INSERT INTO community_posts (
          nickname, title, content, category, tags, 
          city, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        post.nickname,
        post.title,
        post.content,
        post.category,
        JSON.stringify(post.tags),
        'austin',
        passwordHash
      ]);
      
      console.log(`   ✅ ${post.title}`);
    } catch (error) {
      console.log(`   ❌ ${post.title}: ${error.message}`);
    }
  }
}

// 딜 삽입 함수 (listings 테이블 사용)
async function insertDeals() {
  console.log('\n💰 Austin 딜/쿠폰 삽입 중...');
  
  for (const deal of AUSTIN_DEALS) {
    try {
      await pool.query(`
        INSERT INTO listings (
          title, description, category, price_type, 
          author_name, location, city, status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        deal.title,
        deal.description,
        'deals', // 딜 전용 카테고리
        'free',
        deal.business_name,
        deal.location,
        'austin',
        'active',
        deal.valid_until
      ]);
      
      console.log(`   ✅ ${deal.title}`);
    } catch (error) {
      console.log(`   ❌ ${deal.title}: ${error.message}`);
    }
  }
}

// 통계 확인 함수
async function showStats() {
  console.log('\n📊 Austin 콘텐츠 통계:');
  
  try {
    // 뉴스 수
    const newsResult = await pool.query(
      "SELECT COUNT(*) as count FROM news WHERE city = 'austin'"
    );
    console.log(`   📰 뉴스: ${newsResult.rows[0].count}개`);
    
    // 커뮤니티 포스트 수
    const postsResult = await pool.query(
      "SELECT COUNT(*) as count FROM community_posts WHERE city = 'austin'"
    );
    console.log(`   💬 커뮤니티 포스트: ${postsResult.rows[0].count}개`);
    
    // 딜 수
    const dealsResult = await pool.query(
      "SELECT COUNT(*) as count FROM listings WHERE city = 'austin' AND category = 'deals'"
    );
    console.log(`   💰 딜/쿠폰: ${dealsResult.rows[0].count}개`);
    
    // 비즈니스 수
    const businessResult = await pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE city = 'austin'"
    );
    console.log(`   🏢 비즈니스: ${businessResult.rows[0].count}개`);
    
  } catch (error) {
    console.error('통계 조회 에러:', error.message);
  }
}

// 메인 함수
async function main() {
  console.log('🎯 Austin 콘텐츠 생성 시작\n');
  
  try {
    await insertNews();
    await insertCommunityPosts();
    await insertDeals();
    await showStats();
    
    console.log('\n✨ Austin 콘텐츠 생성 완료!');
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await pool.end();
  }
}

main();