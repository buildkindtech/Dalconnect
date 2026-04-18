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

const { Pool } = require('pg');
const https = require('https');
const puppeteer = require('puppeteer');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const GEMINI_KEY = process.env.GOOGLE_AI_KEY || '';
const STORE_NAME = '시온마트 (Zion Market)';

async function getZionSaleImageUrl() {
  console.log('🌐 시온마트 페이지 로딩 (Puppeteer)...');

  // 1차: Puppeteer로 JS 렌더링 후 이미지 URL 추출
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.goto('https://www.zionmarket.com/', { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    // TX 위치 선택 (다이얼로그가 있으면)
    try {
      await page.click('[data-location="TX"], button:has-text("Texas"), #location-tx', { timeout: 3000 });
      await new Promise(r => setTimeout(r, 1500));
    } catch (_) {}

    const imgUrl = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const sale = imgs.find(i => i.src && i.src.includes('sale_images'));
      return sale?.src || '';
    });

    await browser.close();

    if (imgUrl && imgUrl.includes('sale_images')) {
      console.log(`✅ Puppeteer URL: ${imgUrl}`);
      return imgUrl;
    }
    console.log('⚠️ Puppeteer — sale_images URL 없음, 폴백 시도');
  } catch (e) {
    console.log(`⚠️ Puppeteer 실패: ${e.message}`);
    try { await browser?.close(); } catch (_) {}
  }

  // 2차 폴백: 정적 fetch로 HTML에서 URL 파싱
  try {
    const html = await fetchPage('https://www.zionmarket.com/');
    const match = html.match(/https:\/\/admin\.zionmarket\.com\/app_images\/sale_images\/[a-f0-9]+\.jpeg/);
    if (match) {
      console.log(`✅ 폴백 URL: ${match[0]}`);
      return match[0];
    }
    console.log('⚠️ 폴백 HTML에서도 sale_images URL 없음');
  } catch (e) {
    console.log(`⚠️ 폴백 실패: ${e.message}`);
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
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    })
  });

  const data = await res.json();
  if (data.error) {
    console.log('⚠️ Gemini 오류:', JSON.stringify(data.error));
    return [];
  }
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  console.log(`Gemini 응답 길이: ${text.length}자, 미리보기: ${text.slice(0, 150)}`);

  // 완전한 배열 파싱 시도
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[0]);
      console.log(`✅ JSON 파싱 성공: ${items.length}개`);
      return items;
    } catch(e) {
      console.log('⚠️ 완전한 배열 파싱 실패, 개별 객체 추출 시도...');
    }
  }

  // 폴백: 응답이 잘렸을 때 완성된 개별 객체만 추출
  const objMatches = [...text.matchAll(/\{[^{}]*"name"[^{}]*"price"[^{}]*\}/g)];
  if (objMatches.length > 0) {
    const items = [];
    for (const m of objMatches) {
      try { items.push(JSON.parse(m[0])); } catch (_) {}
    }
    if (items.length > 0) {
      console.log(`✅ 부분 파싱 성공: ${items.length}개 (응답 잘림 발생)`);
      return items;
    }
  }

  console.log('⚠️ JSON 추출 실패 — 응답:', text.slice(0, 500));
  return [];
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
