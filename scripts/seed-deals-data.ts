#!/usr/bin/env tsx

import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const dealsData = [
  // 🛒 식료품 딜 (H마트/한남체인/Costco)
  {
    title: '삼겹살 특가 - 신선한 국내산',
    description: 'H마트 40주년 기념 특가! 신선한 국내산 삼겹살을 특별가로 만나보세요.',
    category: 'grocery',
    store: 'H마트',
    original_price: '$7.99/lb',
    deal_price: '$4.99/lb',
    discount: '38% OFF',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    likes: 45,
    views: 230,
    source: 'editorial'
  },
  {
    title: '신라면 5개 + 1개 무료',
    description: '농심 신라면 5개 구매시 1개 추가 무료 증정!',
    category: 'grocery',
    store: 'H마트',
    original_price: '$8.99',
    deal_price: '$8.99',
    discount: 'Buy 5 Get 1 FREE',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    likes: 67,
    views: 340,
    source: 'editorial'
  },
  {
    title: '김치 1갤런 대용량 특가',
    description: '엄마손 김치 1갤런 대용량 특별 할인가',
    category: 'grocery',
    store: 'H마트',
    original_price: '$8.99',
    deal_price: '$5.99',
    discount: '33% OFF',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    likes: 34,
    views: 180,
    source: 'editorial'
  },
  {
    title: '두부 2개 $3 특가',
    description: '부드러운 콩 두부 2개팩 특가 판매',
    category: 'grocery',
    store: '한남체인',
    original_price: '$3.98',
    deal_price: '$3.00',
    discount: '2 for $3',
    deal_url: 'https://hannamchain.com/',
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    likes: 23,
    views: 120,
    source: 'editorial'
  },
  {
    title: '참이슬 소주 특가',
    description: '참이슬 소주 특별가 $4.99',
    category: 'grocery',
    store: '한남체인',
    original_price: '$6.99',
    deal_price: '$4.99',
    discount: '29% OFF',
    deal_url: 'https://hannamchain.com/',
    image_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    likes: 89,
    views: 450,
    source: 'editorial'
  },
  {
    title: '한우 불고기 특가',
    description: '프리미엄 한우 불고기 슬라이스 특별가',
    category: 'grocery',
    store: '한남체인',
    original_price: '$16.99/lb',
    deal_price: '$12.99/lb',
    discount: '24% OFF',
    deal_url: 'https://hannamchain.com/',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    likes: 56,
    views: 280,
    source: 'editorial'
  },
  {
    title: '한국 라면 30팩 대용량',
    description: 'Costco 특가! 한국 라면 30팩 모음 대용량',
    category: 'grocery',
    store: 'Costco',
    original_price: '$19.99',
    deal_price: '$14.99',
    discount: '25% OFF',
    deal_url: 'https://www.costco.com/',
    image_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    likes: 78,
    views: 390,
    source: 'editorial'
  },
  {
    title: '김 20팩 대용량',
    description: '바삭한 김 20팩 대용량 특가',
    category: 'grocery',
    store: 'Costco',
    original_price: '$12.99',
    deal_price: '$9.99',
    discount: '23% OFF',
    deal_url: 'https://www.costco.com/',
    image_url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    likes: 42,
    views: 210,
    source: 'editorial'
  },

  // ✈️ 항공권 딜
  {
    title: 'DFW ↔ ICN 왕복 항공권 봄 특가',
    description: '대한항공 달라스-인천 왕복 항공권 봄 시즌 특별가! 3-5월 출발',
    category: 'flight',
    store: '대한항공',
    original_price: '$1,299',
    deal_price: '$899',
    discount: '31% OFF',
    deal_url: 'https://www.koreanair.com/',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    likes: 134,
    views: 890,
    source: 'editorial'
  },
  {
    title: 'LAX 경유 서울행 특가',
    description: '아시아나항공 LAX 경유 서울 특가! 주말 출발 가능',
    category: 'flight',
    store: '아시아나항공',
    original_price: '$1,199',
    deal_price: '$799',
    discount: '33% OFF',
    deal_url: 'https://flyasiana.com/',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    likes: 89,
    views: 560,
    source: 'editorial'
  },
  {
    title: '도쿄 경유 서울행 최저가',
    description: 'JAL 일본항공 도쿄 경유 서울행 최저가 프로모션',
    category: 'flight',
    store: '일본항공',
    original_price: '$999',
    deal_price: '$749',
    discount: '25% OFF',
    deal_url: 'https://www.jal.com/',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    likes: 67,
    views: 420,
    source: 'editorial'
  },

  // 🍜 한인 식당 딜
  {
    title: '새벽골 BBQ 그랜드 오픈 이벤트',
    description: '신규 오픈 기념! 모든 메뉴 20% 할인 (3월 말까지)',
    category: 'restaurant',
    store: '새벽골 BBQ',
    original_price: 'Regular Price',
    deal_price: '20% OFF',
    discount: '20% OFF',
    deal_url: 'https://google.com/search?q=korean+bbq+dallas',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    likes: 156,
    views: 780,
    source: 'editorial'
  },
  {
    title: '해피아워 특가 - 소주 $3, 맥주 $2',
    description: '매일 오후 3-6시 해피아워! 소주 $3, 맥주 $2',
    category: 'restaurant',
    store: '장수촌',
    original_price: '소주 $5, 맥주 $4',
    deal_price: '소주 $3, 맥주 $2',
    discount: 'Happy Hour',
    deal_url: 'https://google.com/search?q=korean+restaurant+dallas',
    image_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: null, // Ongoing
    likes: 203,
    views: 1020,
    source: 'editorial'
  },
  {
    title: '런치 스페셜 $9.99',
    description: '평일 런치 스페셜 메뉴 $9.99 (불고기, 비빔밥, 된장찌개 포함)',
    category: 'restaurant',
    store: '고향집',
    original_price: '$15.99',
    deal_price: '$9.99',
    discount: '37% OFF',
    deal_url: 'https://google.com/search?q=korean+lunch+special+dallas',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: null, // Ongoing weekday special
    likes: 87,
    views: 435,
    source: 'editorial'
  },

  // 💄 K-뷰티 딜
  {
    title: '이니스프리 그린티 세럼 40% OFF',
    description: 'Amazon 특가! 이니스프리 그린티 세럼 40% 할인',
    category: 'beauty',
    store: 'Amazon',
    original_price: '$29.99',
    deal_price: '$17.99',
    discount: '40% OFF',
    deal_url: 'https://amazon.com/',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    likes: 234,
    views: 1170,
    source: 'editorial'
  },
  {
    title: '라네즈 립 슬리핑 마스크 BOGO',
    description: 'Ulta 특가! 라네즈 립 슬리핑 마스크 하나 사면 하나 무료!',
    category: 'beauty',
    store: 'Ulta Beauty',
    original_price: '$44.00',
    deal_price: '$22.00',
    discount: 'BOGO 50% OFF',
    deal_url: 'https://ulta.com/',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    likes: 189,
    views: 945,
    source: 'editorial'
  },
  {
    title: 'Olive Young 글로벌 배송비 무료',
    description: '$35 이상 주문시 무료 배송! K-뷰티 직접 구매',
    category: 'beauty',
    store: 'Olive Young Global',
    original_price: '$7.99 shipping',
    deal_price: 'FREE',
    discount: 'FREE SHIPPING',
    deal_url: 'https://global.oliveyoung.com/',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    likes: 145,
    views: 725,
    source: 'editorial'
  },

  // 💻 테크 딜
  {
    title: 'T-Mobile 한국 무제한 데이터 패스',
    description: '한국 여행시 무제한 데이터 $5/일! 로밍비 걱정 끝',
    category: 'tech',
    store: 'T-Mobile',
    original_price: '$15/일',
    deal_price: '$5/일',
    discount: '67% OFF',
    deal_url: 'https://t-mobile.com/',
    image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: null, // Ongoing promotion
    likes: 312,
    views: 1560,
    source: 'editorial'
  },
  {
    title: 'Samsung Galaxy S26 Pre-order 특가',
    description: 'Best Buy 삼성 갤럭시 S26 pre-order 특별 할인!',
    category: 'tech',
    store: 'Best Buy',
    original_price: '$1,199',
    deal_price: '$999',
    discount: '$200 OFF',
    deal_url: 'https://bestbuy.com/',
    image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    likes: 456,
    views: 2280,
    source: 'editorial'
  },
  {
    title: 'LG OLED TV 시즌 세일',
    description: 'Costco LG OLED 65인치 TV 시즌 세일! 회원 전용',
    category: 'tech',
    store: 'Costco',
    original_price: '$2,499',
    deal_price: '$1,899',
    discount: '24% OFF',
    deal_url: 'https://costco.com/',
    image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    likes: 178,
    views: 890,
    source: 'editorial'
  },

  // 🎟️ 쿠폰/무료 딜
  {
    title: 'H마트 $10 OFF $50+ 쿠폰',
    description: '$50 이상 구매시 $10 할인 쿠폰! 신규 가입자 대상',
    category: 'coupon',
    store: 'H마트',
    original_price: '$50+',
    deal_price: '$10 OFF',
    discount: '$10 OFF',
    coupon_code: 'HMART10',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    likes: 267,
    views: 1335,
    source: 'editorial'
  },
  {
    title: '한인 뷰티숍 신규 고객 20% OFF',
    description: '신규 고객 대상 전 상품 20% 할인! 첫 구매시',
    category: 'coupon',
    store: '미미 뷰티',
    original_price: 'Regular Price',
    deal_price: '20% OFF',
    discount: '20% OFF',
    coupon_code: 'WELCOME20',
    deal_url: 'https://google.com/search?q=korean+beauty+shop+dallas',
    image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: null, // Ongoing for new customers
    likes: 134,
    views: 670,
    source: 'editorial'
  },
  {
    title: '생일 무료 디저트 - 한정식집',
    description: '생일인 고객에게 무료 디저트 제공! 신분증 지참',
    category: 'coupon',
    store: '대장금',
    original_price: '$8.99',
    deal_price: 'FREE',
    discount: 'FREE',
    deal_url: 'https://google.com/search?q=korean+restaurant+dallas',
    image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: null, // Ongoing birthday offer
    likes: 89,
    views: 445,
    source: 'editorial'
  },
  
  // 추가 grocery 딜들
  {
    title: '한국 쌀 20lb 대용량 특가',
    description: '프리미엄 한국 쌀 20lb 대용량 특가!',
    category: 'grocery',
    store: 'H마트',
    original_price: '$29.99',
    deal_price: '$24.99',
    discount: '17% OFF',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    likes: 76,
    views: 380,
    source: 'editorial'
  },
  {
    title: '고추장 2개 $8 특가',
    description: '순창 고추장 500g 2개팩 특가',
    category: 'grocery',
    store: '한남체인',
    original_price: '$10.98',
    deal_price: '$8.00',
    discount: '2 for $8',
    deal_url: 'https://hannamchain.com/',
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    likes: 54,
    views: 270,
    source: 'editorial'
  },
  
  // 추가 beauty 딜들
  {
    title: 'Sulwhasoo 자음생크림 세트',
    description: 'Sephora 설화수 자음생크림 세트 특가! 기프트 박스 포함',
    category: 'beauty',
    store: 'Sephora',
    original_price: '$189.00',
    deal_price: '$149.00',
    discount: '21% OFF',
    deal_url: 'https://sephora.com/',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    likes: 298,
    views: 1490,
    source: 'editorial'
  },
  
  // Shopping deals
  {
    title: 'Zara 한복 스타일 원피스 50% OFF',
    description: 'Zara 한복에서 영감받은 원피스 컬렉션 반값 세일!',
    category: 'shopping',
    store: 'Zara',
    original_price: '$79.90',
    deal_price: '$39.95',
    discount: '50% OFF',
    deal_url: 'https://zara.com/',
    image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    likes: 167,
    views: 835,
    source: 'editorial'
  },
  {
    title: 'Uniqlo Heattech 온가족 할인',
    description: 'Uniqlo Heattech 이너웨어 온가족 30% 할인!',
    category: 'shopping',
    store: 'Uniqlo',
    original_price: '$19.90',
    deal_price: '$13.93',
    discount: '30% OFF',
    deal_url: 'https://uniqlo.com/',
    image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    likes: 123,
    views: 615,
    source: 'editorial'
  },
  
  // 급하게 마감되는 딜들 (D-1, D-2)
  {
    title: '🔥 급마감! 찜닭 밀키트 70% OFF',
    description: '오늘밤 12시 마감! CJ 찜닭 밀키트 초특가',
    category: 'grocery',
    store: '한남체인',
    original_price: '$16.99',
    deal_price: '$4.99',
    discount: '70% OFF',
    deal_url: 'https://hannamchain.com/',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    likes: 678,
    views: 3390,
    source: 'editorial'
  },
  {
    title: '🔥 내일마감! 프리미엄 한우 50% OFF',
    description: '한정수량! 내일까지만 프리미엄 한우 반값',
    category: 'grocery',
    store: 'H마트',
    original_price: '$29.99/lb',
    deal_price: '$14.99/lb',
    discount: '50% OFF',
    deal_url: 'https://www.hmart.com/',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    likes: 445,
    views: 2225,
    source: 'editorial'
  }
];

async function seedDealsData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log(`Inserting ${dealsData.length} deals...`);
    
    for (const deal of dealsData) {
      const query = `
        INSERT INTO deals (
          title, description, category, store, original_price, deal_price, 
          discount, coupon_code, deal_url, image_url, expires_at, 
          likes, views, source
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `;
      
      const values = [
        deal.title,
        deal.description,
        deal.category,
        deal.store,
        deal.original_price,
        deal.deal_price,
        deal.discount,
        deal.coupon_code || null,
        deal.deal_url,
        deal.image_url,
        deal.expires_at,
        deal.likes,
        deal.views,
        deal.source
      ];
      
      await pool.query(query, values);
      console.log(`✅ Inserted: ${deal.title}`);
    }
    
    console.log(`🎉 Successfully inserted ${dealsData.length} deals!`);
    
  } catch (error) {
    console.error('❌ Error inserting deals:', error);
  } finally {
    await pool.end();
  }
}

seedDealsData();