delete process.env.DATABASE_URL;

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// UUID v4 생성 함수
function generateUUID() {
  return crypto.randomUUID();
}

// 달라스 한인 커뮤니티 관련 실제 특가 데이터
const dealsData = [
  {
    title: 'H-Mart Plano 주말 특가 - 한우 불고기',
    discount: '40% OFF',
    store: 'H-Mart Plano',
    original_price: '$24.99',
    deal_price: '$14.99',
    coupon_code: 'WEEKEND40',
    deal_url: 'https://www.hmart.com',
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    source: 'manual',
    views: 234,
    likes: 42,
    description: 'H-Mart Plano점 주말 특가! 한우 불고기 40% 할인',
    category: '식품'
  },
  {
    title: '99 Ranch Market - 신선한 해산물 15% 할인',
    discount: '15% OFF',
    store: '99 Ranch Market',
    original_price: '$19.99',
    deal_price: '$16.99',
    coupon_code: null,
    deal_url: 'https://www.99ranch.com',
    image_url: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=400',
    source: 'manual',
    views: 189,
    likes: 28,
    description: 'Carrollton 99 Ranch Market 해산물 코너 할인 행사',
    category: '식품'
  },
  {
    title: '신라면 24개입 박스 특가',
    discount: '$5 OFF',
    store: 'Super H Mart',
    original_price: '$29.99',
    deal_price: '$24.99',
    coupon_code: 'RAMEN5',
    deal_url: 'https://www.hmart.com',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    source: 'manual',
    views: 312,
    likes: 67,
    description: '신라면 24개입 박스 $5 할인! 이번 주만 적용',
    category: '식품'
  },
  {
    title: '김치냉장고 (딤채) 매장 전시품 특가',
    discount: '30% OFF',
    store: 'K-Appliances Dallas',
    original_price: '$899.99',
    deal_price: '$629.99',
    coupon_code: null,
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400',
    source: 'manual',
    views: 156,
    likes: 34,
    description: '매장 전시품 한정 특가, Koreatown 매장 방문 필수',
    category: '가전'
  },
  {
    title: 'Tous Les Jours - 케이크 20% 할인 쿠폰',
    discount: '20% OFF',
    store: 'Tous Les Jours',
    original_price: '$35.00',
    deal_price: '$28.00',
    coupon_code: 'CAKE20',
    deal_url: 'https://www.tljus.com',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    source: 'manual',
    views: 201,
    likes: 41,
    description: 'Plano 매장 생일 케이크 주문 시 20% 할인 (3월 한정)',
    category: '식품'
  },
  {
    title: '한국 화장품 세트 Bundle 특가',
    discount: 'Buy 2 Get 1',
    store: 'K-Beauty Mart',
    original_price: '$89.97',
    deal_price: '$59.98',
    coupon_code: 'BUNDLE3',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    source: 'manual',
    views: 278,
    likes: 53,
    description: '한국 스킨케어 세트 2개 구매 시 1개 무료! Richardson 매장',
    category: '뷰티'
  },
  {
    title: '태권도 학원 등록 특가 (3개월)',
    discount: '$100 OFF',
    store: 'Dallas Taekwondo Academy',
    original_price: '$399.00',
    deal_price: '$299.00',
    coupon_code: 'NEW2026',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400',
    source: 'manual',
    views: 167,
    likes: 29,
    description: '신규 등록 시 3개월 수업료 $100 할인 (Frisco 지점)',
    category: '교육'
  },
  {
    title: 'Paris Baguette - 빵 5개 이상 구매 시 15% 할인',
    discount: '15% OFF',
    store: 'Paris Baguette',
    original_price: '$25.00',
    deal_price: '$21.25',
    coupon_code: null,
    deal_url: 'https://www.parisbaguette.com',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    source: 'manual',
    views: 223,
    likes: 38,
    description: 'Carrollton 매장 빵 5개 이상 구매 시 자동 할인',
    category: '식품'
  },
  {
    title: '한국어 과외 그룹 수업 특가',
    discount: '25% OFF',
    store: 'Korean Language Center',
    original_price: '$400.00',
    deal_price: '$300.00',
    coupon_code: 'GROUP25',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    source: 'manual',
    views: 142,
    likes: 24,
    description: '3-5명 그룹 수업 한 달 등록 시 25% 할인 (Plano)',
    category: '교육'
  },
  {
    title: '한국식 마사지 신규 고객 할인',
    discount: '$30 OFF',
    store: 'Seoul Spa & Massage',
    original_price: '$120.00',
    deal_price: '$90.00',
    coupon_code: 'FIRST30',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    source: 'manual',
    views: 198,
    likes: 36,
    description: '신규 고객 첫 방문 시 60분 코스 $30 할인 (Richardson)',
    category: '서비스'
  },
  {
    title: 'K-BBQ All You Can Eat 특가',
    discount: '$10 OFF',
    store: 'Gen Korean BBQ',
    original_price: '$39.99',
    deal_price: '$29.99',
    coupon_code: 'LUNCH10',
    deal_url: 'https://www.genkoreanbbq.com',
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    source: 'manual',
    views: 345,
    likes: 72,
    description: '평일 런치 무한리필 $10 할인 (Carrollton 매장)',
    category: '레스토랑'
  },
  {
    title: '한국 도서 베스트셀러 30% 할인',
    discount: '30% OFF',
    store: 'Korean Book Store',
    original_price: '$29.99',
    deal_price: '$20.99',
    coupon_code: 'BOOK30',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    source: 'manual',
    views: 134,
    likes: 22,
    description: 'Koreatown 서점 베스트셀러 30% 할인 (3월 한정)',
    category: '도서'
  },
  {
    title: '한복 대여 특가 (돌잔치/명절)',
    discount: '20% OFF',
    store: 'Seoul Hanbok Rental',
    original_price: '$150.00',
    deal_price: '$120.00',
    coupon_code: 'HANBOK20',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1583486831272-e5b9c9bbd6d0?w=400',
    source: 'manual',
    views: 167,
    likes: 31,
    description: '돌잔치/명절 한복 대여 20% 할인 (Plano 매장)',
    category: '의류'
  },
  {
    title: '자동차 보험 신규 가입 할인',
    discount: '$200 OFF',
    store: 'Dallas Korean Insurance',
    original_price: '$1200.00',
    deal_price: '$1000.00',
    coupon_code: null,
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
    source: 'manual',
    views: 289,
    likes: 48,
    description: '신규 자동차 보험 가입 시 연간 $200 할인 (한인 에이전트)',
    category: '보험'
  },
  {
    title: '한국 식품 정기 배송 첫 달 50% 할인',
    discount: '50% OFF',
    store: 'K-Food Delivery',
    original_price: '$80.00',
    deal_price: '$40.00',
    coupon_code: 'FIRST50',
    deal_url: null,
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    source: 'manual',
    views: 256,
    likes: 54,
    description: '한국 식품 정기 배송 서비스 첫 달 50% 할인 (DFW 전 지역)',
    category: '식품'
  }
];

async function addDeals() {
  console.log('🏷️ 특가 딜 데이터 추가 중...\n');
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2주 후
  
  for (let i = 0; i < dealsData.length; i++) {
    const deal = dealsData[i];
    const id = generateUUID();
    
    await sql`
      INSERT INTO deals (
        id, title, description, category, store, original_price, deal_price,
        discount, coupon_code, deal_url, image_url, expires_at,
        is_verified, likes, views, source, created_at
      ) VALUES (
        ${id}, ${deal.title}, ${deal.description}, ${deal.category}, ${deal.store}, 
        ${deal.original_price}, ${deal.deal_price}, ${deal.discount}, ${deal.coupon_code}, 
        ${deal.deal_url}, ${deal.image_url}, ${expiresAt.toISOString()},
        true, ${deal.likes}, ${deal.views}, ${deal.source}, ${now.toISOString()}
      )
    `;
    
    console.log(`✅ ${i + 1}. ${deal.title} (${deal.discount})`);
  }
  
  console.log(`\n✅ 총 ${dealsData.length}개 특가 딜 추가 완료!`);
}

addDeals().catch(console.error);
