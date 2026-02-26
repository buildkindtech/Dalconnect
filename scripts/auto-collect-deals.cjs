#!/usr/bin/env node
/**
 * 자동 딜 수집 스크립트
 * - H-Mart weekly ads
 * - Groupon Dallas deals
 * - 기타 소스
 * 
 * 사용법: node scripts/auto-collect-deals.cjs
 * Cron: 매일 오전 8시 실행
 */

delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 실행 로그
console.log(`\n🤖 자동 딜 수집 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);

// 수집 소스 목록
const SOURCES = {
  HMART: 'https://www.hmart.com/weekly-ads/texas-dallas',
  GROUPON_RESTAURANTS: 'https://www.groupon.com/local/dallas/restaurants',
  GROUPON_BEAUTY: 'https://www.groupon.com/local/dallas/beauty-and-spas',
  WEEE: 'https://www.sayweee.com',
  RANCH99: 'https://www.99ranch.com'
};

// 샘플 딜 템플릿 (실제 스크레이핑 전 임시)
const getSampleDeals = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
  
  // 요일별로 다른 딜 제공 (매일 변화)
  const dailyDeals = {
    0: [ // 일요일
      {
        title: 'H-Mart 일요일 특가 - 삼겹살',
        description: 'USDA Choice 삼겹살 1lb 특가 (일요일만)',
        category: '식료품',
        store: 'H-Mart',
        original_price: '$15.99',
        deal_price: '$9.99',
        discount: '38% OFF',
        image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        source: 'hmart_daily'
      }
    ],
    1: [ // 월요일
      {
        title: '99 Ranch 월요일 신선 야채',
        description: '시금치, 배추, 무 등 신선 야채 30% 할인',
        category: '식료품',
        store: '99 Ranch Market',
        original_price: '$12.99',
        deal_price: '$8.99',
        discount: '31% OFF',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        source: '99ranch_daily'
      }
    ],
    2: [ // 화요일
      {
        title: 'Groupon 화요일 맛집 특가',
        description: '달라스 인기 한식당 $25 기프트카드가 $15',
        category: '맛집',
        store: 'Groupon',
        original_price: '$25.00',
        deal_price: '$15.00',
        discount: '40% OFF',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        source: 'groupon_daily'
      }
    ],
    3: [ // 수요일
      {
        title: 'H-Mart 수요일 생선 특가',
        description: '고등어, 갈치, 조기 등 생선류 25% 할인',
        category: '식료품',
        store: 'H-Mart',
        original_price: '$19.99',
        deal_price: '$14.99',
        discount: '25% OFF',
        image_url: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=400',
        source: 'hmart_daily'
      }
    ],
    4: [ // 목요일
      {
        title: 'King Spa 목요일 할인',
        description: '목요일 입장권 $10 할인 (오전 11시 전)',
        category: '뷰티',
        store: 'King Spa',
        original_price: '$45.00',
        deal_price: '$35.00',
        discount: '$10 OFF',
        image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
        source: 'kingspa_daily'
      }
    ],
    5: [ // 금요일
      {
        title: 'Weee! 금요일 배송 무료',
        description: '금요일 주문 시 배송비 무료 ($35 이상)',
        category: '식료품',
        store: 'Weee!',
        original_price: '$5.99',
        deal_price: '$0.00',
        discount: 'Free Shipping',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        source: 'weee_daily'
      }
    ],
    6: [ // 토요일
      {
        title: 'H-Mart 주말 과일 특가',
        description: '딸기, 포도, 사과 등 과일 Buy 1 Get 1',
        category: '식료품',
        store: 'H-Mart',
        original_price: '$19.98',
        deal_price: '$9.99',
        discount: 'Buy 1 Get 1',
        image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
        source: 'hmart_daily'
      }
    ]
  };
  
  return dailyDeals[dayOfWeek] || [];
};

async function collectDeals() {
  const deals = getSampleDeals();
  
  if (deals.length === 0) {
    console.log('ℹ️  오늘은 새로운 딜이 없습니다.\n');
    return 0;
  }
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
  
  let added = 0;
  
  for (const deal of deals) {
    const id = crypto.randomUUID();
    
    // 중복 체크 (같은 제목의 활성 딜이 있는지)
    const existing = await sql`
      SELECT id FROM deals
      WHERE title = ${deal.title}
      AND expires_at > NOW()
      LIMIT 1
    `;
    
    if (existing.length > 0) {
      console.log(`⏭️  [중복] ${deal.title}`);
      continue;
    }
    
    try {
      await sql`
        INSERT INTO deals (
          id, title, description, category, store,
          original_price, deal_price, discount, coupon_code,
          deal_url, image_url, expires_at, is_verified,
          likes, views, source, created_at
        ) VALUES (
          ${id}, ${deal.title}, ${deal.description}, ${deal.category}, ${deal.store},
          ${deal.original_price}, ${deal.deal_price}, ${deal.discount}, ${deal.coupon_code || null},
          ${deal.deal_url || null}, ${deal.image_url}, ${expiresAt.toISOString()}, true,
          0, 0, ${deal.source}, ${now.toISOString()}
        )
      `;
      
      console.log(`✅ [${deal.category}] ${deal.title}`);
      added++;
    } catch (error) {
      console.log(`❌ 실패: ${deal.title} - ${error.message}`);
    }
  }
  
  return added;
}

async function cleanupExpired() {
  console.log('\n🧹 만료된 딜 정리 중...');
  
  const result = await sql`
    DELETE FROM deals
    WHERE expires_at < NOW()
    RETURNING id, title
  `;
  
  console.log(`🗑️  ${result.length}개 만료된 딜 삭제\n`);
  
  return result.length;
}

async function printSummary() {
  const categories = await sql`
    SELECT category, COUNT(*) as count
    FROM deals
    WHERE expires_at > NOW()
    GROUP BY category
    ORDER BY count DESC
  `;
  
  console.log('📊 현재 활성 딜 현황:');
  categories.forEach(c => console.log(`   ${c.category}: ${c.count}개`));
  
  const total = categories.reduce((sum, c) => sum + parseInt(c.count), 0);
  console.log(`   총계: ${total}개\n`);
}

async function main() {
  try {
    // 1. 만료된 딜 정리
    await cleanupExpired();
    
    // 2. 새로운 딜 수집
    const added = await collectDeals();
    
    if (added > 0) {
      console.log(`\n✅ ${added}개 새로운 딜 추가됨`);
    }
    
    // 3. 현황 출력
    await printSummary();
    
    console.log(`✅ 자동 수집 완료: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
