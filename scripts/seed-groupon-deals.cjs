#!/usr/bin/env node
// Groupon DFW 딜 시딩 (2026-03-19 수집)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const EXPIRES_GROUPON = '2026-04-30T23:59:00Z';
const EXPIRES_SAMS = '2026-04-15T23:59:00Z';

const deals = [
  // ──── 그루폰 DFW ────
  {
    title: '샘스클럽 멤버십 70% 할인 — $15',
    description: '샘스클럽 1년 클럽/플러스 멤버십 최대 70% 할인! $50 → $15. 대용량 식품/생필품 최저가 구매 기회.',
    category: '쇼핑',
    store: "Sam's Club",
    original_price: '$50',
    deal_price: '$15',
    discount: '70% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/n-sams-club-membership-packages-18',
    image_url: 'https://img.grouponcdn.com/deal/3VTkXDwSWb2s5HQHZ7GHgDzn9Fzm/3V-1200x630/v1/c700x420.jpg',
    expires_at: EXPIRES_SAMS,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: 'MS Office 2024 정품 라이선스 91% 할인',
    description: 'Microsoft Office 2024 Professional Plus (Windows) 또는 Standard (Mac) 평생 라이선스. $249 → $21.74!',
    category: '테크',
    store: 'MyCodes24 (Groupon)',
    original_price: '$249.99',
    deal_price: '$21.74',
    discount: '91% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/world-wide-electronic-software-delivery-llc-mycodes24',
    image_url: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '오일 교환 50% 할인 — Kwik Kar (Grapevine)',
    description: 'Kwik Kar Wash & Auto (Grapevine/Flower Mound) 오일 교환 최대 50% 할인. $95 → $47.50.',
    category: '생활',
    store: 'Kwik Kar (Grapevine)',
    original_price: '$95',
    deal_price: '$47.50',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/speedway-express-car-wash',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '커플 마사지 50% 할인 — NY Foot Spa',
    description: 'NY Foot Spa 커플 마사지 50% 할인. $140 → $70! 달라스 지역 한인이 많이 찾는 스파.',
    category: '뷰티',
    store: 'NY Foot Spa',
    original_price: '$140',
    deal_price: '$70',
    discount: '50% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/ny-foot-spa-2',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '레이저 제모 6회 85% 할인 — $85',
    description: '레이저 제모 소/중/대 부위 6회 세션. $570 → $85! Salud Texas Clinic (Dallas 지역).',
    category: '뷰티',
    store: 'Salud Texas Clinic',
    original_price: '$570',
    deal_price: '$85',
    discount: '85% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/salud-texas-clinic-3',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '보톡스 20유닛 34% 할인 — Total Med Solutions',
    description: 'Total Med Solutions DFW 보톡스 20유닛 34% 할인. $300 → $198. Flower Mound 위치.',
    category: '뷰티',
    store: 'Total Med Solutions DFW',
    original_price: '$300',
    deal_price: '$198',
    discount: '34% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/total-med-solutions-dfw-9',
    image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '다이스포트 주사 37% 할인 — Total Med Solutions',
    description: '다이스포트(Dysport) 주름 개선 주사 최대 37% 할인. $315 → $198. Flower Mound.',
    category: '뷰티',
    store: 'Total Med Solutions DFW',
    original_price: '$315',
    deal_price: '$198',
    discount: '37% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/total-med-solutions-dfw-4',
    image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: 'Slick City 액션파크 44% 할인 — Denton',
    description: 'Slick City Denton 워터슬라이드 액션파크 최대 44% 할인. $31 → $19.99. 아이들과 가족 나들이 최고!',
    category: '엔터테인먼트',
    store: 'Slick City Denton',
    original_price: '$31.22',
    deal_price: '$19.99',
    discount: '36% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/slick-city-denton',
    image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
  {
    title: '보톡스 20/40/60유닛 31% 할인 — Jana Nurse Med Spa',
    description: 'Jana Nurse Med Spa 보톡스 20, 40, 또는 60유닛 31% 할인. $260 → $179. Plano 위치.',
    category: '뷰티',
    store: 'Jana Nurse Med Spa',
    original_price: '$260',
    deal_price: '$179',
    discount: '31% OFF',
    coupon_code: null,
    deal_url: 'https://www.groupon.com/deals/jana-nurse-med-spa',
    image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
    expires_at: EXPIRES_GROUPON,
    is_verified: true,
    source: 'groupon.com',
  },
];

async function run() {
  try {
    // 기존 Groupon 딜 삭제
    await pool.query(`DELETE FROM deals WHERE source = 'groupon.com'`);
    console.log('기존 Groupon 딜 삭제 완료');

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
      console.log(`✅ ${deal.title}`);
    }

    const result = await pool.query(`SELECT category, COUNT(*) as cnt FROM deals WHERE expires_at > NOW() GROUP BY category ORDER BY cnt DESC`);
    console.log('\n📊 카테고리별 딜:');
    result.rows.forEach(r => console.log(`  ${r.category}: ${r.cnt}개`));

    const total = await pool.query(`SELECT COUNT(*) FROM deals WHERE expires_at > NOW()`);
    console.log(`\n✅ 총 유효 딜: ${total.rows[0].count}개`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
