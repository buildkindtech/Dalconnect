#!/usr/bin/env node
/**
 * auto-update-costco-sams.cjs
 * Costco + Sam's Club 주간 세일 자동 수집 → DB upsert
 * 실행: node scripts/auto-update-costco-sams.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const https = require('https');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;



// fetch helper
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    };
    const req = https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Gemini REST API로 HTML에서 딜 파싱
async function parseDealsWithGemini(html, storeName) {
  const prompt = `${storeName} 웹페이지 HTML에서 현재 할인/세일 중인 상품 목록을 추출해줘.
최대 8개, JSON 배열로만 답해 (다른 텍스트 없이):
[
  {
    "title": "상품명 (한국어로 번역)",
    "discount": "할인율 또는 절약금액 (예: 30% OFF, $5 절약)",
    "original_price": "원가 (있으면)",
    "deal_price": "할인가 (있으면)",
    "expires_at": "마감일 YYYY-MM-DD (있으면, 없으면 null)",
    "image_url": "이미지 URL (있으면)"
  }
]

HTML (앞 5000자):
${html.substring(0, 5000)}`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } }
    });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) resolve(JSON.parse(jsonMatch[0]));
          else resolve([]);
        } catch (e) {
          console.error('Gemini 파싱 실패:', e.message);
          resolve([]);
        }
      });
    });
    req.on('error', (e) => { console.error('Gemini 요청 실패:', e.message); resolve([]); });
    req.write(body);
    req.end();
  });
}

async function upsertDeals(deals, store, category, source, dealUrlBase) {
  let count = 0;
  const expiresDefault = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일

  for (const d of deals) {
    if (!d.title || d.title.length < 3) continue;
    const expires = d.expires_at ? new Date(d.expires_at) : expiresDefault;

    // 이미 같은 제목+스토어 있으면 스킵
    const existing = await pool.query(
      'SELECT id FROM deals WHERE store = $1 AND title = $2',
      [store, d.title]
    );
    if (existing.rows.length > 0) {
      // expires_at 업데이트만
      await pool.query(
        'UPDATE deals SET expires_at = $1 WHERE store = $2 AND title = $3',
        [expires, store, d.title]
      );
      continue;
    }

    await pool.query(
      `INSERT INTO deals (title, description, category, store, discount, original_price, deal_price, deal_url, image_url, source, expires_at, likes, views, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, false)`,
      [
        d.title,
        d.discount || '',
        category,
        store,
        d.discount || '세일 중',
        d.original_price || '',
        d.deal_price || '',
        dealUrlBase,
        d.image_url || '',
        source,
        expires
      ]
    );
    count++;
  }
  return count;
}

async function updateCostco() {
  console.log('📦 Costco 딜 수집 중...');
  try {
    // Costco 월간 쿠폰 페이지 시도
    const html = await fetchUrl('https://www.costco.com/savings-events.html');
    const deals = await parseDealsWithGemini(html, 'Costco');

    if (deals.length > 0) {
      const count = await upsertDeals(deals, 'Costco', '식료품', 'costco.com', 'https://www.costco.com/savings-events.html');
      console.log(`✅ Costco ${count}개 딜 추가`);
    } else {
      // fallback: 알려진 Costco 고정 딜 추가
      const fallbackDeals = [
        {
          title: 'Costco 4월 쿠폰북 — 식품/생활용품 특가',
          discount: '월간쿠폰',
          original_price: '',
          deal_price: '회원 전용',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          image_url: ''
        }
      ];
      const count = await upsertDeals(fallbackDeals, 'Costco', '식료품', 'costco.com', 'https://www.costco.com/savings-events.html');
      console.log(`ℹ️ Costco fallback ${count}개 추가`);
    }
  } catch (e) {
    console.error('Costco 수집 실패:', e.message);
  }
}

async function updateSamsClub() {
  console.log('🏪 Sam\'s Club 딜 수집 중...');
  try {
    const html = await fetchUrl('https://www.samsclub.com/shop/savings');
    const deals = await parseDealsWithGemini(html, "Sam's Club");

    if (deals.length > 0) {
      const count = await upsertDeals(deals, "Sam's Club", '쇼핑', 'samsclub.com', 'https://www.samsclub.com/shop/savings');
      console.log(`✅ Sam's Club ${count}개 딜 추가`);
    } else {
      // fallback
      const fallbackDeals = [
        {
          title: "Sam's Club Instant Savings — 이번 달 할인 이벤트",
          discount: '월간 세이빙',
          original_price: '',
          deal_price: '회원 전용',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          image_url: ''
        },
        {
          title: "Sam's Club 멤버십 $25 할인 (신규가입)",
          discount: '$25 OFF',
          original_price: '$50',
          deal_price: '$25',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          image_url: ''
        }
      ];
      const count = await upsertDeals(fallbackDeals, "Sam's Club", '쇼핑', 'samsclub.com', 'https://www.samsclub.com/shop/savings');
      console.log(`ℹ️ Sam's Club fallback ${count}개 추가`);
    }
  } catch (e) {
    console.error("Sam's Club 수집 실패:", e.message);
  }
}

// 만료된 Costco/Sams 딜 정리
async function cleanOldDeals() {
  const result = await pool.query(
    `DELETE FROM deals WHERE source IN ('costco.com', 'samsclub.com') AND expires_at < NOW()`
  );
  if (result.rowCount > 0) {
    console.log(`🗑️ 만료 딜 ${result.rowCount}개 정리`);
  }
}

async function main() {
  console.log('🛒 Costco + Sam\'s Club 딜 업데이트 시작...');
  try {
    await cleanOldDeals();
    await updateCostco();
    await updateSamsClub();
    console.log('✅ 완료');
  } catch (e) {
    console.error('전체 오류:', e.message);
  } finally {
    await pool.end();
  }
}

main();
