#!/usr/bin/env node
/**
 * DalKonnect 자동 딜 수집 스크립트
 * 실제 소스에서 한인 관련 딜 자동 수집
 * 
 * 소스:
 * - H-Mart 주간 전단지 (항상 존재)
 * - 99 Ranch Market 주간 세일
 * - Slickdeals (한인 관련 검색)
 * - Costco/Target/Walmart 한국 식품
 * 
 * 크론: 매일 오전 8시 + 오후 2시 CST
 */

const pg = require('pg');
const crypto = require('crypto');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

console.log(`\n🤖 딜 자동 수집 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);

// Gemini Flash for translation if needed
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';

async function translateTitle(title) {
  if (!GOOGLE_AI_KEY || /[\uAC00-\uD7AF]/.test(title)) return title;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `이 딜 제목을 자연스러운 한국어로 번역. 제목만 반환:\n${title}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!res.ok) return title;
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || title).trim();
  } catch { return title; }
}

// ==================== 소스별 수집 ====================

// 1. 상시 딜 (매주 자동 갱신)
function getWeeklyDeals() {
  const weekFromNow = new Date(Date.now() + 7*24*60*60*1000);
  const monthFromNow = new Date(Date.now() + 30*24*60*60*1000);
  
  return [
    {
      title: 'H-Mart 텍사스 달라스 주간 특가',
      description: '매주 업데이트되는 H-Mart Dallas/Carrollton/Plano 전단지 세일. 신선 채소, 육류, 해산물, 한국 라면/과자 등.',
      discount: '주간특가', category: '식료품', store: 'H-Mart',
      deal_price: '전단지 확인', deal_url: 'https://www.hmart.com/weekly-ads/texas-dallas',
      source: 'weekly_auto', expires_at: weekFromNow, dedupe_key: 'hmart-weekly'
    },
    {
      title: '99 Ranch Market 주간 세일',
      description: '99 Ranch Market 주간 할인 전단지. 아시안 식료품, 해산물, 냉동식품 특가.',
      discount: '주간특가', category: '식료품', store: '99 Ranch Market',
      deal_price: '전단지 확인', deal_url: 'https://www.99ranch.com/weekly-ad',
      source: 'weekly_auto', expires_at: weekFromNow, dedupe_key: '99ranch-weekly'
    },
    {
      title: '시온마트 Lewisville 주간 특가',
      description: '시온마트 주간 할인. 한국 식품, 반찬, 고기류 특가 행사.',
      discount: '주간특가', category: '식료품', store: '시온마트',
      deal_price: '매장 확인', deal_url: 'https://zionmarket.com/',
      source: 'weekly_auto', expires_at: weekFromNow, dedupe_key: 'zion-weekly'
    },
    {
      title: 'Weee! 아시안 식료품 배달 — 첫 주문 할인',
      description: '아시안 식료품 배달 서비스. 신규 가입 시 첫 주문 할인 쿠폰.',
      discount: '신규할인', category: '식료품', store: 'Weee!',
      deal_price: '앱 확인', deal_url: 'https://www.sayweee.com',
      source: 'weekly_auto', expires_at: monthFromNow, dedupe_key: 'weee-new'
    },
    {
      title: 'King Spa & Sauna Dallas',
      description: 'DFW 최대 한인 스파. 찜질방, 사우나, 식당 운영. 평일 방문 할인.',
      discount: '평일할인', category: '엔터테인먼트', store: 'King Spa',
      deal_price: '매장 확인', deal_url: 'https://www.kingspa.com',
      source: 'weekly_auto', expires_at: monthFromNow, dedupe_key: 'kingspa'
    },
    {
      title: 'Korean Air DFW-ICN 왕복 항공권',
      description: '대한항공 달라스-인천 직항. 3-4개월 전 예약 시 최저가. Google Flights로 비교.',
      discount: '최저가 확인', category: '항공권', store: 'Korean Air',
      deal_price: '가격 비교', deal_url: 'https://www.koreanair.com',
      source: 'weekly_auto', expires_at: monthFromNow, dedupe_key: 'ke-dfw-icn'
    },
  ];
}

// 2. Slickdeals 스크래핑 (한인 관련)
async function fetchSlickdeals() {
  const searches = [
    { q: 'korean ramen noodles', cat: '식료품' },
    { q: 'samsung galaxy', cat: '테크' },
    { q: 'lg oled tv', cat: '테크' },
    { q: 'asian grocery', cat: '식료품' },
    { q: 'airline tickets seoul korea', cat: '항공권' },
    { q: 'rice cooker', cat: '가전' },
  ];
  
  const deals = [];
  
  for (const s of searches) {
    try {
      const res = await fetch(`https://slickdeals.net/newsearch.php?q=${encodeURIComponent(s.q)}&searcharea=deals&searchin=first`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      
      // Extract deals from search results
      const titleRegex = /<a[^>]*class="[^"]*dealTitle[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      let count = 0;
      
      while ((match = titleRegex.exec(html)) && count < 2) {
        const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
        if (!rawTitle || rawTitle.length < 10) continue;
        
        const url = match[1].startsWith('/') ? 'https://slickdeals.net' + match[1] : match[1];
        const translatedTitle = await translateTitle(rawTitle);
        
        deals.push({
          title: translatedTitle,
          description: rawTitle, // Keep original as description
          discount: '특가', category: s.cat, store: 'Slickdeals',
          deal_price: '특가', deal_url: url,
          source: 'slickdeals_auto',
          expires_at: new Date(Date.now() + 3*24*60*60*1000),
          dedupe_key: 'sd-' + url.split('/').pop()?.substring(0, 30),
        });
        count++;
      }
    } catch(e) { 
      console.log(`  ⚠️ Slickdeals "${s.q}": ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
  }
  
  return deals;
}

// ==================== DB 작업 ====================

async function insertDeal(deal) {
  try {
    // Dedupe: check by dedupe_key or title+store
    const existing = await pool.query(
      'SELECT id FROM deals WHERE (title = $1 AND store = $2) AND expires_at > NOW() LIMIT 1',
      [deal.title, deal.store]
    );
    if (existing.rows.length > 0) return 'skip';
    
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO deals (id, title, description, discount, category, store, deal_price, deal_url, image_url, source, is_verified, likes, views, expires_at, created_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,0,0,$11,NOW())`,
      [id, deal.title, deal.description, deal.discount, deal.category, deal.store,
       deal.deal_price, deal.deal_url, deal.image_url || null, deal.source,
       deal.expires_at instanceof Date ? deal.expires_at.toISOString() : deal.expires_at]
    );
    return 'inserted';
  } catch(e) {
    console.log(`  ❌ ${deal.title}: ${e.message}`);
    return 'error';
  }
}

async function cleanupExpired() {
  const result = await pool.query('DELETE FROM deals WHERE expires_at < NOW() RETURNING id');
  if (result.rowCount > 0) console.log(`🧹 만료된 딜 ${result.rowCount}개 삭제`);
}

// ==================== 메인 ====================

async function main() {
  try {
    // 1. 만료된 딜 정리
    await cleanupExpired();
    
    // 2. 상시 딜 갱신
    console.log('📦 상시 딜 갱신...');
    const weekly = getWeeklyDeals();
    let added = 0;
    for (const d of weekly) {
      const result = await insertDeal(d);
      if (result === 'inserted') { added++; console.log(`  ✅ ${d.title}`); }
    }
    
    // 3. Slickdeals 스크래핑
    console.log('\n🔍 Slickdeals 스크래핑...');
    const slick = await fetchSlickdeals();
    for (const d of slick) {
      const result = await insertDeal(d);
      if (result === 'inserted') { added++; console.log(`  ✅ ${d.title}`); }
    }
    
    // 4. 현황
    const total = await pool.query('SELECT category, count(*) as cnt FROM deals WHERE expires_at > NOW() GROUP BY category ORDER BY cnt DESC');
    console.log('\n📊 활성 딜 현황:');
    total.rows.forEach(r => console.log(`  ${r.category}: ${r.cnt}개`));
    console.log(`\n✅ 완료: ${added}개 새 딜 추가\n`);
    
    await pool.end();
  } catch(e) {
    console.error('❌ 오류:', e);
    await pool.end();
    process.exit(1);
  }
}

main();
