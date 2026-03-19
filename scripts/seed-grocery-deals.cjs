#!/usr/bin/env node
// Zion Market TX 주간 세일 (3/19~3/25 2026) + 코마트/신촌마트 플레이스홀더
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const EXPIRES = '2026-03-25T23:59:00Z'; // 3/25 마감

const deals = [
  // ──── 시온마트 (ZION MARKET TEXAS) ────
  {
    title: '동원 고등어 통조림 2캔 특가',
    description: '동원 자연산 고등어 통조림 400g/캔. 이번 주 주간 특가!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$3.99/캔',
    deal_price: '2 for $5',
    discount: '37% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '아시안 배 (Asian Pears) 3개 $1.99',
    description: '신선한 아시안 배. 3개에 $1.99 특가!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$1.99/개',
    deal_price: '3 for $1.99',
    discount: '33% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '네이블 오렌지 / 카라카라 오렌지 2개 $0.99',
    description: '달콤한 네이블 오렌지 또는 카라카라 오렌지. 2개에 단돈 $0.99!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$0.99/개',
    deal_price: '2 for $0.99',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '감자 10lb $2.99',
    description: '감자 10파운드 한 봉지 $2.99. 요리 재료 저렴하게!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$5.99',
    deal_price: '$2.99',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '나파 배추 (Napa Cabbage) $0.99/개',
    description: '신선한 나파 배추 낱개 $0.99. 김치 담그기 딱!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$1.99',
    deal_price: '$0.99',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '신라면 멀티팩 $14.99',
    description: '농심 신라면 멀티팩 특가 $14.99!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$18.99',
    deal_price: '$14.99',
    discount: '21% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '한미 잡채 $11.99',
    description: '한미 잡채 세일! 간편하게 즐기는 한식 잡채 $11.99.',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$15.99',
    deal_price: '$11.99',
    discount: '25% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '새우 (Shrimp) 2lb $4.99',
    description: '신선한 새우 2파운드 팩 $4.99! 바베큐/요리용으로 최고.',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$9.99',
    deal_price: '$4.99',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '대파 $1.99',
    description: '신선한 대파 $1.99. 찌개/볶음 필수 재료!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$2.99',
    deal_price: '$1.99',
    discount: '33% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },
  {
    title: '레드 포도 $1.49/lb',
    description: '달콤한 레드 포도 $1.49/파운드 특가!',
    category: '한인마트',
    store: '시온마트 (Zion Market)',
    original_price: '$2.49/lb',
    deal_price: '$1.49/lb',
    discount: '40% OFF',
    coupon_code: null,
    deal_url: 'https://www.zionmarket.com/',
    image_url: 'https://admin.zionmarket.com/app_images/sale_images/69bb391092f3c.jpeg',
    expires_at: EXPIRES,
    is_verified: true,
    source: 'zionmarket.com',
  },

  // ──── 코마트 (KOMART) ────
  {
    title: '코마트 이번 주 세일 — 매장 방문 확인',
    description: '코마트 주간 세일 진행 중! 매장 방문 또는 전화 문의로 최신 세일 정보를 확인하세요.',
    category: '한인마트',
    store: '코마트 (Komart)',
    original_price: '매장 문의',
    deal_price: '매장 확인',
    discount: '주간 세일',
    coupon_code: null,
    deal_url: '',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    expires_at: EXPIRES,
    is_verified: false,
    source: 'manual',
  },

  // ──── 신촌마트 (SINCHON MART) ────
  {
    title: '신촌마트 이번 주 세일 — 매장 방문 확인',
    description: '신촌마트 주간 세일 진행 중! 매장 방문 또는 전화 문의로 최신 세일 정보를 확인하세요.',
    category: '한인마트',
    store: '신촌마트 (Sinchon Mart)',
    original_price: '매장 문의',
    deal_price: '매장 확인',
    discount: '주간 세일',
    coupon_code: null,
    deal_url: '',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    expires_at: EXPIRES,
    is_verified: false,
    source: 'manual',
  },
];

async function run() {
  try {
    // 기존 마트 딜 삭제 (중복 방지)
    await pool.query(`DELETE FROM deals WHERE store IN ('시온마트 (Zion Market)', '코마트 (Komart)', '신촌마트 (Sinchon Mart)')`);
    console.log('기존 마트 딜 삭제 완료');

    for (const deal of deals) {
      await pool.query(`
        INSERT INTO deals (
          title, description, category, store,
          original_price, deal_price, discount,
          coupon_code, deal_url, image_url,
          expires_at, is_verified, source,
          likes, views, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,0,NOW())
      `, [
        deal.title, deal.description, deal.category, deal.store,
        deal.original_price, deal.deal_price, deal.discount,
        deal.coupon_code, deal.deal_url, deal.image_url,
        deal.expires_at, deal.is_verified, deal.source
      ]);
      console.log(`✅ ${deal.store}: ${deal.title}`);
    }

    const result = await pool.query(`SELECT store, COUNT(*) as cnt FROM deals GROUP BY store ORDER BY cnt DESC`);
    console.log('\n📊 딜 현황:');
    result.rows.forEach(r => console.log(`  ${r.store}: ${r.cnt}개`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
