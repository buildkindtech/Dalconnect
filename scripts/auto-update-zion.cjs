#!/usr/bin/env node
/**
 * 시온마트 (Zion Market TX) 주간 세일 자동 업데이트
 * 매주 목요일 실행 (새 세일 목요일 시작)
 * 
 * 방식:
 * 1. zionmarket.com 페이지 로드 (agent-browser)
 * 2. TX 선택 → 세일 이미지 URL 추출
 * 3. Gemini Vision으로 아이템/가격 파싱
 * 4. DB에 시온마트 딜 교체
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const GEMINI_KEY = process.env.GOOGLE_AI_KEY || '';
const STORE_NAME = '시온마트 (Zion Market)';

async function getZionSaleImageUrl() {
  console.log('🌐 시온마트 페이지 로딩...');
  try {
    // agent-browser로 TX 페이지 열기
    execSync('agent-browser open "https://www.zionmarket.com/"', { timeout: 15000 });
    execSync('sleep 2');
    
    // 다이얼로그 닫고 TX 선택
    try { execSync('agent-browser click e8', { timeout: 5000 }); } catch(e) {}
    try { execSync('agent-browser click e10', { timeout: 5000 }); } catch(e) {}
    execSync('sleep 2');
    
    // 페이지 소스에서 이미지 URL 추출
    const result = execSync(`agent-browser evaluate "Array.from(document.querySelectorAll('img')).find(i=>i.src&&i.src.includes('sale_images'))?.src||''"`, 
      { timeout: 10000 }).toString().trim();
    
    if (result && result.includes('sale_images')) {
      console.log(`✅ 이미지 URL: ${result}`);
      return result;
    }
  } catch(e) {
    console.log(`⚠️ agent-browser 방법 실패: ${e.message}`);
  }

  // 폴백: 직접 fetch로 DOM 파싱
  try {
    const html = await fetchPage('https://www.zionmarket.com/');
    const match = html.match(/https:\/\/admin\.zionmarket\.com\/app_images\/sale_images\/[a-f0-9]+\.jpeg/);
    if (match) {
      console.log(`✅ 폴백 URL: ${match[0]}`);
      return match[0];
    }
  } catch(e) {
    console.log(`⚠️ 폴백도 실패: ${e.message}`);
  }
  
  return null;
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function parseDealsFromImage(imageUrl) {
  if (!GEMINI_KEY) { console.log('⚠️ GOOGLE_AI_KEY 없음, 이미지 파싱 불가'); return []; }
  
  console.log('🤖 Gemini Vision으로 딜 파싱...');
  const imageBase64 = await fetchImageAsBase64(imageUrl);

  const prompt = `This is a Zion Market (Korean grocery store) weekly sale flyer for Texas stores.
Extract ALL sale items with exact prices. Return JSON array only, no explanation.
Format: [{"name":"item name in Korean","price":"deal price","original":"original price if shown","unit":"unit/qty","category":"produce|meat|seafood|grocery"}]
Include every visible item. If price has 2for format, keep it as-is.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
      ]}],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch(e) {
    console.log('⚠️ JSON 파싱 실패:', e.message);
    return [];
  }
}

function getThisWeekExpiry() {
  // 다음 수요일 자정 (시온마트 세일은 목~수)
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 3=Wed, 4=Thu
  const daysUntilWed = (3 - day + 7) % 7 || 7;
  const expires = new Date(now);
  expires.setDate(expires.getDate() + daysUntilWed);
  expires.setHours(23, 59, 0, 0);
  return expires;
}

async function updateZionDeals(items, imageUrl) {
  const expires = getThisWeekExpiry();
  
  // 기존 시온마트 딜 삭제
  await pool.query(`DELETE FROM deals WHERE store = $1`, [STORE_NAME]);
  console.log(`🗑️  기존 시온마트 딜 삭제`);
  
  let count = 0;
  for (const item of items) {
    if (!item.name || !item.price) continue;
    
    // 카테고리 매핑
    const catMap = { produce: '식료품', meat: '한인마트', seafood: '한인마트', grocery: '한인마트' };
    const cat = catMap[item.category] || '한인마트';
    
    // 할인율 계산
    let discount = '세일';
    if (item.original && item.price) {
      const orig = parseFloat(item.original.replace(/[^0-9.]/g, ''));
      const deal = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      if (orig > 0 && deal > 0 && orig > deal) {
        discount = `${Math.round((1 - deal/orig)*100)}% OFF`;
      }
    }
    
    try {
      await pool.query(`
        INSERT INTO deals (title, description, category, store, original_price, deal_price, discount,
          deal_url, image_url, expires_at, is_verified, source, likes, views, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'zionmarket.com',0,0,NOW())
      `, [
        `${item.name} ${item.price}`,
        `시온마트 이번 주 세일 | ${item.unit || ''}`.trim(),
        cat, STORE_NAME,
        item.original || '정상가', item.price, discount,
        'https://www.zionmarket.com/', imageUrl,
        expires.toISOString()
      ]);
      count++;
    } catch(e) { console.log(`  ⚠️ ${item.name}: ${e.message}`); }
  }
  
  return count;
}

async function main() {
  console.log(`\n🛒 시온마트 주간 세일 업데이트 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);
  
  try {
    const imageUrl = await getZionSaleImageUrl();
    if (!imageUrl) throw new Error('이미지 URL을 찾을 수 없음');
    
    const items = await parseDealsFromImage(imageUrl);
    console.log(`📦 파싱된 아이템: ${items.length}개`);
    
    if (items.length === 0) throw new Error('아이템 파싱 실패 (0개)');
    
    const count = await updateZionDeals(items, imageUrl);
    console.log(`✅ 시온마트 딜 ${count}개 업데이트 완료`);
    
    await pool.end();
    process.exit(0);
  } catch(e) {
    console.error('❌ 오류:', e.message);
    await pool.end();
    process.exit(1);
  }
}

main();
