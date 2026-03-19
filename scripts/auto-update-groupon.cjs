#!/usr/bin/env node
/**
 * Groupon DFW 딜 자동 업데이트
 * 매주 월요일 실행
 * 
 * 방식: Groupon 로컬 페이지 scrape → 한국어 번역 → DB 업서트
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const GEMINI_KEY = process.env.GOOGLE_AI_KEY || '';

async function translateTitle(en) {
  if (!GEMINI_KEY || /[\uAC00-\uD7AF]/.test(en)) return en;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `한국어로 자연스럽게 번역. 제목만 반환 (30자 이내):\n${en}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60, thinkingConfig: { thinkingBudget: 0 } }
      })
    });
    const d = await res.json();
    return (d.candidates?.[0]?.content?.parts?.[0]?.text || en).trim();
  } catch { return en; }
}

function getCategoryFromTitle(title) {
  const t = title.toLowerCase();
  if (t.match(/botox|dysport|filler|laser|spa|massage|beauty|hair|nail|skin/)) return '뷰티';
  if (t.match(/restaurant|food|dining|eat|pizza|sushi|bbq|buffet/)) return '맛집';
  if (t.match(/flight|airline|hotel|travel|resort|trip/)) return '항공권';
  if (t.match(/oil change|tire|auto|car wash|mechanic/)) return '생활';
  if (t.match(/park|adventure|escape|game|theater|movie|museum|entertainment/)) return '엔터테인먼트';
  if (t.match(/membership|club|warehouse|wholesale/)) return '쇼핑';
  if (t.match(/software|tech|computer|phone|app/)) return '테크';
  return '쇼핑';
}

async function scrapeGrouponDFW() {
  console.log('🎯 Groupon DFW 스크래핑...');
  
  try {
    // agent-browser로 Groupon 페이지 로드
    execSync('agent-browser open "https://www.groupon.com/local/dallas-fort-worth"', { timeout: 20000 });
    execSync('sleep 4');
    
    // 딜 카드 데이터 추출
    const raw = execSync(`agent-browser evaluate "JSON.stringify(Array.from(document.querySelectorAll('a[href*=\\"/deals/\\"]')).slice(0,20).map(c=>{const t=c.querySelector('[class*=title],[class*=Title],h3,h2');const p=c.querySelectorAll('[class*=price],[class*=Price]');return{title:t?.textContent?.trim(),prices:Array.from(p).map(x=>x.textContent?.trim()),href:c.href}}).filter(x=>x.title&&x.href&&!x.href.includes('groupon.com/deals/g')))"`,
      { timeout: 15000 }).toString().trim();
    
    const deals = JSON.parse(raw);
    console.log(`  📦 ${deals.length}개 딜 발견`);
    return deals;
  } catch(e) {
    console.log(`  ⚠️ agent-browser 실패: ${e.message}`);
    return [];
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/\$[\d,]+\.?\d*/);
  return match ? match[0] : priceStr.trim();
}

function calcDiscount(original, deal) {
  const o = parseFloat((original || '').replace(/[^0-9.]/g, ''));
  const d = parseFloat((deal || '').replace(/[^0-9.]/g, ''));
  if (o > 0 && d > 0 && o > d) return `${Math.round((1 - d/o)*100)}% OFF`;
  return '할인';
}

async function updateGrouponDeals(rawDeals) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일
  
  // 기존 Groupon 딜 삭제
  await pool.query(`DELETE FROM deals WHERE source = 'groupon.com'`);
  console.log('🗑️  기존 Groupon 딜 삭제');
  
  let count = 0;
  for (const item of rawDeals) {
    if (!item.title || !item.href) continue;
    
    // 가격 파싱 (첫번째=원래가격, 두번째=할인가)
    const prices = (item.prices || []).filter(p => p && p.includes('$'));
    const originalPrice = prices[0] || null;
    const dealPrice = prices[1] || prices[0] || '할인가';
    
    const category = getCategoryFromTitle(item.title);
    const discount = calcDiscount(originalPrice, dealPrice);
    const titleKo = await translateTitle(item.title);
    
    // 스토어명 추출 (URL에서)
    const storeMatch = item.href.match(/\/deals\/([^?]+)/);
    const storeName = storeMatch ? storeMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 40) : 'Groupon DFW';
    
    try {
      await pool.query(`
        INSERT INTO deals (title, description, category, store, original_price, deal_price, discount,
          deal_url, image_url, expires_at, is_verified, source, likes, views, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'groupon.com',0,0,NOW())
      `, [
        titleKo, item.title, category, storeName,
        originalPrice || '정상가', dealPrice, discount,
        item.href, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        expires.toISOString()
      ]);
      count++;
      console.log(`  ✅ ${titleKo}`);
    } catch(e) { console.log(`  ⚠️ ${item.title}: ${e.message}`); }
    
    await new Promise(r => setTimeout(r, 500)); // 번역 rate limit
  }
  
  return count;
}

async function main() {
  console.log(`\n🎯 Groupon DFW 딜 업데이트 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);
  
  try {
    const rawDeals = await scrapeGrouponDFW();
    if (rawDeals.length === 0) throw new Error('딜 데이터 없음');
    
    const count = await updateGrouponDeals(rawDeals);
    console.log(`\n✅ Groupon 딜 ${count}개 업데이트 완료`);
    
    await pool.end();
    process.exit(0);
  } catch(e) {
    console.error('❌ 오류:', e.message);
    await pool.end();
    process.exit(1);
  }
}

main();
