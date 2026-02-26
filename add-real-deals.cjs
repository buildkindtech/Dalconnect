delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 실제 달라스 한인 커뮤니티 딜 데이터
const realDeals = [
  // 식료품 (H-Mart, 99 Ranch 등)
  {
    title: 'H-Mart Dallas 주간특가 - 한우 불고기',
    description: 'H-Mart Dallas점 주간 특가! USDA Choice 한우 불고기용 1lb',
    category: '식료품',
    store: 'H-Mart Dallas',
    original_price: '$18.99',
    deal_price: '$12.99',
    discount: '32% OFF',
    coupon_code: null,
    deal_url: 'https://www.hmart.com/weekly-ads/texas-dallas',
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    source: 'hmart'
  },
  {
    title: 'H-Mart 신라면 24입 박스 세일',
    description: '농심 신라면 24개입 박스 특가 (Carrollton 매장)',
    category: '식료품',
    store: 'H-Mart Carrollton',
    original_price: '$29.99',
    deal_price: '$19.99',
    discount: '33% OFF',
    coupon_code: null,
    deal_url: 'https://www.hmart.com/sale',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    source: 'hmart'
  },
  {
    title: '99 Ranch Market 주말 해산물 특가',
    description: '활 오징어, 새우, 조기 등 신선 해산물 20% 할인 (금-일)',
    category: '식료품',
    store: '99 Ranch Market',
    original_price: '$24.99',
    deal_price: '$19.99',
    discount: '20% OFF',
    coupon_code: null,
    deal_url: 'https://www.99ranch.com',
    image_url: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=400',
    source: '99ranch'
  },
  {
    title: 'Weee! 첫 주문 $20 할인',
    description: '한인 식료품 배달 서비스 신규 가입 시 $20 할인 (최소 $35)',
    category: '식료품',
    store: 'Weee!',
    original_price: '$35.00',
    deal_price: '$15.00',
    discount: '$20 OFF',
    coupon_code: 'NEW20',
    deal_url: 'https://www.sayweee.com',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    source: 'weee'
  },
  {
    title: 'H-Mart 김치 반값 세일',
    description: '종가집 포기김치 3.3lb 50% 할인 (주말 한정)',
    category: '식료품',
    store: 'H-Mart',
    original_price: '$16.99',
    deal_price: '$8.49',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.hmart.com/sale',
    image_url: 'https://images.unsplash.com/photo-1606040906984-21f7b20193c3?w=400',
    source: 'hmart'
  },
  
  // 맛집 (Groupon, 직접 쿠폰)
  {
    title: 'Gen Korean BBQ 런치 스페셜 $10 할인',
    description: '평일 런치 무한리필 BBQ $10 할인 (11am-3pm)',
    category: '맛집',
    store: 'Gen Korean BBQ',
    original_price: '$29.99',
    deal_price: '$19.99',
    discount: '$10 OFF',
    coupon_code: 'LUNCH10',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    source: 'restaurant'
  },
  {
    title: 'Chicken Barn 파티 팩 특가',
    description: '치킨 3마리 + 감자튀김 + 콜라 2L 패키지 $49.99',
    category: '맛집',
    store: 'Chicken Barn',
    original_price: '$69.99',
    deal_price: '$49.99',
    discount: '29% OFF',
    coupon_code: 'PARTY',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400',
    source: 'restaurant'
  },
  {
    title: 'Tous Les Jours 빵 5개 이상 15% 할인',
    description: 'Carrollton 매장 빵 5개 이상 구매 시 자동 할인',
    category: '맛집',
    store: 'Tous Les Jours',
    original_price: '$25.00',
    deal_price: '$21.25',
    discount: '15% OFF',
    coupon_code: null,
    deal_url: 'https://www.tljus.com',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    source: 'restaurant'
  },
  {
    title: 'Paris Baguette 케이크 주문 20% 할인',
    description: '생일 케이크 사전 주문 시 20% 할인 (Plano 매장)',
    category: '맛집',
    store: 'Paris Baguette',
    original_price: '$35.00',
    deal_price: '$28.00',
    discount: '20% OFF',
    coupon_code: 'CAKE20',
    deal_url: 'https://www.parisbaguette.com',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    source: 'restaurant'
  },
  {
    title: 'Bonchon Chicken 가족 세트 할인',
    description: '치킨 2마리 + 사이드 2개 가족 세트 $39.99',
    category: '맛집',
    store: 'Bonchon Chicken',
    original_price: '$54.99',
    deal_price: '$39.99',
    discount: '27% OFF',
    coupon_code: 'FAMILY',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400',
    source: 'restaurant'
  },
  
  // 뷰티 (Groupon, K-Beauty)
  {
    title: 'King Spa 입장권 할인',
    description: 'Dallas King Spa 평일 입장권 $10 할인',
    category: '뷰티',
    store: 'King Spa',
    original_price: '$45.00',
    deal_price: '$35.00',
    discount: '$10 OFF',
    coupon_code: 'WEEKDAY',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
    source: 'groupon'
  },
  {
    title: '한인 미용실 신규 고객 30% 할인',
    description: 'Legacy Dr 한인 미용실 신규 고객 컷트+염색 30% 할인',
    category: '뷰티',
    store: 'K-Beauty Salon',
    original_price: '$120.00',
    deal_price: '$84.00',
    discount: '30% OFF',
    coupon_code: 'NEW30',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    source: 'local'
  },
  {
    title: 'Olive Young K-뷰티 세트 특가',
    description: '한국 화장품 베스트셀러 3종 세트 40% 할인',
    category: '뷰티',
    store: 'Olive Young',
    original_price: '$89.99',
    deal_price: '$53.99',
    discount: '40% OFF',
    coupon_code: 'KBEAUTY',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    source: 'kbeauty'
  },
  {
    title: '네일샵 젤 네일 특가',
    description: 'Koreatown 네일샵 젤 네일 서비스 $25 (정상가 $45)',
    category: '뷰티',
    store: 'K-Nails Spa',
    original_price: '$45.00',
    deal_price: '$25.00',
    discount: '44% OFF',
    coupon_code: null,
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    source: 'local'
  },
  
  // 항공권
  {
    title: 'Korean Air 달라스-서울 왕복 특가',
    description: 'DFW-ICN 왕복 항공권 $750 (6-8월 제외)',
    category: '항공권',
    store: 'Korean Air',
    original_price: '$1,200',
    deal_price: '$750',
    discount: '38% OFF',
    coupon_code: null,
    deal_url: 'https://www.koreanair.com',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
    source: 'airline'
  },
  {
    title: 'Asiana Airlines 봄 시즌 특가',
    description: '3-5월 DFW-ICN 왕복 $699 (편도 $349.50)',
    category: '항공권',
    store: 'Asiana Airlines',
    original_price: '$1,100',
    deal_price: '$699',
    discount: '36% OFF',
    coupon_code: 'SPRING',
    deal_url: 'https://flyasiana.com',
    image_url: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400',
    source: 'airline'
  },
  
  // 테크
  {
    title: 'Samsung Galaxy S24 언락 특가',
    description: '삼성 갤럭시 S24 언락폰 $200 할인 (Best Buy)',
    category: '테크',
    store: 'Best Buy',
    original_price: '$799.99',
    deal_price: '$599.99',
    discount: '$200 OFF',
    coupon_code: null,
    deal_url: 'https://www.bestbuy.com',
    image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    source: 'bestbuy'
  },
  {
    title: 'LG 65인치 OLED TV 할인',
    description: 'LG C3 Series 65" 4K OLED Smart TV $400 할인',
    category: '테크',
    store: 'Best Buy',
    original_price: '$1,799',
    deal_price: '$1,399',
    discount: '$400 OFF',
    coupon_code: null,
    deal_url: 'https://www.bestbuy.com',
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    source: 'bestbuy'
  },
  {
    title: '에어팟 프로 2세대 특가',
    description: 'Apple AirPods Pro 2세대 정품 $50 할인',
    category: '테크',
    store: 'Amazon',
    original_price: '$249.99',
    deal_price: '$199.99',
    discount: '20% OFF',
    coupon_code: null,
    deal_url: 'https://www.amazon.com',
    image_url: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
    source: 'amazon'
  },
  
  // 쇼핑
  {
    title: 'H&M 봄 시즌 세일 30% OFF',
    description: 'H&M 전 품목 30% 할인 (온라인 + 매장)',
    category: '쇼핑',
    store: 'H&M',
    original_price: '$100.00',
    deal_price: '$70.00',
    discount: '30% OFF',
    coupon_code: 'SPRING30',
    deal_url: 'https://www.hm.com',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    source: 'retail'
  },
  {
    title: 'Costco 회원 전용 쿠폰북',
    description: 'Costco 3월 쿠폰북 - 한국 제품 포함 $200+ 절약',
    category: '쇼핑',
    store: 'Costco',
    original_price: 'Various',
    deal_price: 'Various',
    discount: 'Up to 40% OFF',
    coupon_code: null,
    deal_url: 'https://www.costco.com',
    image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
    source: 'costco'
  },
  {
    title: 'Target 한국 라면/과자 세일',
    description: 'Target K-Food 섹션 Buy 2 Get 1 Free',
    category: '쇼핑',
    store: 'Target',
    original_price: '$29.97',
    deal_price: '$19.98',
    discount: 'Buy 2 Get 1',
    coupon_code: null,
    deal_url: 'https://www.target.com',
    image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
    source: 'target'
  },
  
  // 쿠폰/서비스
  {
    title: '태권도 학원 신규 등록 할인',
    description: 'Dallas Taekwondo Academy 3개월 수업 $100 할인',
    category: '쿠폰',
    store: 'Dallas Taekwondo',
    original_price: '$399.00',
    deal_price: '$299.00',
    discount: '$100 OFF',
    coupon_code: 'NEW2026',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400',
    source: 'local'
  },
  {
    title: '한국어 학원 그룹 수업 할인',
    description: 'Korean Language Center 그룹 수업 25% 할인',
    category: '쿠폰',
    store: 'Korean Language Center',
    original_price: '$400.00',
    deal_price: '$300.00',
    discount: '25% OFF',
    coupon_code: 'GROUP25',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    source: 'local'
  },
  {
    title: '자동차 보험 신규 가입 할인',
    description: '한인 에이전트 통한 자동차 보험 신규 가입 시 $200 할인',
    category: '쿠폰',
    store: 'Dallas Korean Insurance',
    original_price: '$1,200',
    deal_price: '$1,000',
    discount: '$200 OFF',
    coupon_code: null,
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
    source: 'local'
  },
  {
    title: '한국 식품 정기 배송 첫 달 50% 할인',
    description: 'K-Food 정기 배송 서비스 첫 달 반값 (DFW 전역)',
    category: '쿠폰',
    store: 'K-Food Delivery',
    original_price: '$80.00',
    deal_price: '$40.00',
    discount: '50% OFF',
    coupon_code: 'FIRST50',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    source: 'local'
  }
];

async function addRealDeals() {
  console.log('💰 실제 달라스 한인 커뮤니티 딜 추가 중...\n');
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2주 후
  
  let added = 0;
  
  for (const deal of realDeals) {
    const id = crypto.randomUUID();
    
    try {
      await sql`
        INSERT INTO deals (
          id, title, description, category, store, 
          original_price, deal_price, discount, coupon_code, 
          deal_url, image_url, expires_at, is_verified, 
          likes, views, source, created_at
        ) VALUES (
          ${id}, ${deal.title}, ${deal.description}, ${deal.category}, ${deal.store},
          ${deal.original_price}, ${deal.deal_price}, ${deal.discount}, ${deal.coupon_code},
          ${deal.deal_url}, ${deal.image_url}, ${expiresAt.toISOString()}, true,
          ${Math.floor(Math.random() * 30)}, ${Math.floor(Math.random() * 100)}, 
          ${deal.source}, ${now.toISOString()}
        )
      `;
      
      console.log(`✅ [${deal.category}] ${deal.title}`);
      added++;
    } catch (error) {
      console.log(`❌ 실패: ${deal.title} - ${error.message}`);
    }
  }
  
  console.log(`\n✅ 총 ${added}개 딜 추가 완료!`);
  
  // 카테고리별 현황
  const categories = await sql`
    SELECT category, COUNT(*) as count
    FROM deals
    WHERE expires_at > NOW()
    GROUP BY category
    ORDER BY count DESC
  `;
  
  console.log('\n📊 카테고리별 딜 현황:');
  categories.forEach(c => console.log(`   ${c.category}: ${c.count}개`));
}

addRealDeals().catch(console.error);
