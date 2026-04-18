#!/usr/bin/env node
/**
 * DalKonnect 주간 뉴스 요약 캐러셀 (매주 일요일 오전 10am)
 *
 * 지난 7일 뉴스 TOP5 → Puppeteer 6장 슬라이드 → Telegram 미리보기
 * Aaron "올려" → weekly-summary-post.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');
const { Client } = require('pg');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';
const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const today = new Date().toISOString().slice(0, 10);
const mmdd = today.slice(5).replace('-', '');
const OUT_DIR = path.join('/tmp', `weekly-${mmdd}`);
const MEM_DIR = path.join(BASE, 'memory', 'weekly-summary', today);

function readEnv(file, key) {
  try { return (fs.readFileSync(file, 'utf8').match(new RegExp(`${key}=(.+)`)) || [])[1]?.trim(); }
  catch { return null; }
}
const GEMINI_KEY = readEnv('/Users/aaron/.claude/api-keys.env', 'GOOGLE_AI_KEY')
  || readEnv(path.join(BASE, '.env.local'), 'GOOGLE_AI_KEY');

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
  });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d).candidates?.[0]?.content?.parts?.[0]?.text || ''));
    });
    req.on('error', rej); req.write(body); req.end();
  });
}

async function sendTelegramPhoto(photoPath, caption) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('photo', fs.createReadStream(photoPath));
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: 'POST',
      headers: form.getHeaders(),
    }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); });
    req.on('error', rej); form.pipe(req);
  });
}

// ─── 날짜 범위 텍스트 ─────────────────────────────────────────
function weekRange() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - 6);
  const fmt = d => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)} ~ ${fmt(now)}`;
}

// ─── 슬라이드 HTML ────────────────────────────────────────────
const BG = 'linear-gradient(160deg, #0a0c14 0%, #0f1a30 50%, #0a0c14 100%)';
const ACCENT = '#f59e0b'; // 주간 요약은 골드 계열

function coverSlide(range, headline) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px;text-align:center;position:relative;overflow:hidden;}
.badge{background:rgba(245,158,11,0.15);border:1px solid ${ACCENT};color:${ACCENT};
font-size:24px;font-weight:700;padding:10px 28px;border-radius:50px;margin-bottom:36px;letter-spacing:2px;}
.week-icon{font-size:80px;margin-bottom:28px;}
.title{color:#fff;font-size:56px;font-weight:900;line-height:1.3;margin-bottom:16px;}
.range{color:${ACCENT};font-size:30px;font-weight:700;margin-bottom:24px;}
.headline{color:rgba(255,255,255,0.65);font-size:28px;line-height:1.6;max-width:860px;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${ACCENT};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.5);font-size:22px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="badge">📰 이번 주 달라스 뉴스</div>
<div class="week-icon">🗞️</div>
<div class="title">이번 주 꼭 알아야 할\n달라스 소식 TOP 5</div>
<div class="range">${range}</div>
<div class="headline">${headline}</div>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

function newsSlide(num, category, catIcon, title, summary, catAccent) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px 88px;text-align:center;position:relative;overflow:hidden;}
.num-badge{color:${ACCENT};font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:20px;}
.cat-badge{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
color:rgba(255,255,255,0.7);font-size:22px;font-weight:600;padding:8px 20px;border-radius:50px;
margin-bottom:32px;}
.icon{font-size:68px;margin-bottom:24px;}
.title{color:#fff;font-size:44px;font-weight:900;line-height:1.35;margin-bottom:28px;white-space:pre-line;}
.divider{width:56px;height:4px;background:${ACCENT};border-radius:2px;margin:0 auto 28px;}
.summary{color:rgba(255,255,255,0.8);font-size:28px;line-height:1.65;max-width:860px;white-space:pre-line;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${ACCENT};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.4);font-size:20px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="num-badge">TOP ${num} / 5</div>
<div class="cat-badge">${catIcon} ${category}</div>
<div class="title">${title}</div>
<div class="divider"></div>
<div class="summary">${summary}</div>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

function ctaSlide(range) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px;text-align:center;position:relative;overflow:hidden;}
.icon{font-size:80px;margin-bottom:32px;}
.title{color:#fff;font-size:54px;font-weight:900;line-height:1.3;margin-bottom:20px;}
.sub{color:rgba(255,255,255,0.65);font-size:28px;line-height:1.65;margin-bottom:48px;}
.cta{background:${ACCENT};color:#000;font-size:30px;font-weight:900;
padding:18px 52px;border-radius:50px;margin-bottom:20px;}
.link{color:${ACCENT};font-size:26px;font-weight:600;margin-bottom:40px;}
.hashtags{color:rgba(255,255,255,0.3);font-size:19px;line-height:1.8;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${ACCENT};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.45);font-size:22px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="icon">📬</div>
<div class="title">매주 달라스 뉴스 요약</div>
<div class="sub">팔로우하면 매주 일요일<br>한 주의 핵심 달라스 소식을<br>한 번에 받아보실 수 있어요</div>
<div class="cta">👉 팔로우하기</div>
<div class="link">dalkonnect.com/news</div>
<div class="hashtags">#달라스한인 #달커넥트 #DFW한인 #달라스뉴스 #주간뉴스요약</div>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

// ─── 메인 ────────────────────────────────────────────────────
(async () => {
  console.log(`[${today}] 주간 뉴스 요약 생성 시작`);
  [OUT_DIR, MEM_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  // DB에서 지난 7일 뉴스 수집
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const { rows: newsRows } = await client.query(`
    SELECT title, category, content, created_at
    FROM news
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND title IS NOT NULL AND length(title) > 10
    ORDER BY created_at DESC
    LIMIT 30
  `);
  await client.end();
  console.log(`  DB 뉴스 ${newsRows.length}개 로드`);

  const newsText = newsRows.slice(0, 20)
    .map(n => `[${n.category || '일반'}] ${n.title}`)
    .join('\n');

  // Gemini로 TOP5 선별 + 요약
  const range = weekRange();
  const prompt = `달라스 DFW 한인 커뮤니티를 위한 주간 뉴스 요약 캐러셀을 만든다.

이번 주 범위: ${range}

지난 7일 뉴스 목록:
${newsText}

가장 달라스 한인에게 중요한 TOP 5를 선별하고 각각 한 줄 요약 + 상세 요약을 작성하라.
카테고리 다양하게 (로컬/경제/한국/스포츠 등 겹치지 않게).

규칙: JSON 문자열 값 안에 줄바꿈 절대 금지. 코드블록 없이 JSON만 출력.

{"range":"${range}","coverHeadline":"핵심한줄(30자이내)","top5":[{"rank":1,"category":"카테고리","icon":"이모지","title":"제목(25자이내)","summary":"2-3줄요약(줄바꿈없이한줄로)"},{"rank":2,"category":"카테고리","icon":"이모지","title":"제목","summary":"요약"},{"rank":3,"category":"카테고리","icon":"이모지","title":"제목","summary":"요약"},{"rank":4,"category":"카테고리","icon":"이모지","title":"제목","summary":"요약"},{"rank":5,"category":"카테고리","icon":"이모지","title":"제목","summary":"요약"}],"caption":"캡션(줄바꿈없이)"}`;

  console.log('  Gemini로 TOP5 선별 중...');
  const raw = await callGemini(prompt);
  let data;
  const start = raw.indexOf('{');
  if (start === -1) throw new Error('Gemini JSON 없음: ' + raw.slice(0, 200));
  let depth = 0, end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('Gemini JSON 닫힘 없음');
  try {
    const jsonStr = raw.slice(start, end + 1).replace(/[\r\n]/g, ' ');
    data = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Gemini JSON 파싱 오류: ' + e.message.slice(0, 100));
  }
  console.log(`  TOP5 선별 완료: ${data.top5.map(n => n.title.slice(0, 15)).join(' | ')}`);

  // 슬라이드 생성
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  const slidePaths = [];

  // 슬라이드 1: 표지
  await page.setContent(coverSlide(range, data.coverHeadline), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));
  const cover = path.join(OUT_DIR, 'slide-1.jpg');
  await page.screenshot({ path: cover, type: 'jpeg', quality: 92 });
  slidePaths.push(cover);
  console.log('  슬라이드 1/7 (표지) ✅');

  // 슬라이드 2-6: 뉴스 5개
  for (let i = 0; i < data.top5.length; i++) {
    const n = data.top5[i];
    await page.setContent(newsSlide(n.rank, n.category, n.icon, n.title, n.summary), { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));
    const p = path.join(OUT_DIR, `slide-${i + 2}.jpg`);
    await page.screenshot({ path: p, type: 'jpeg', quality: 92 });
    slidePaths.push(p);
    console.log(`  슬라이드 ${i + 2}/7 (TOP${n.rank}) ✅`);
  }

  // 슬라이드 7: CTA
  await page.setContent(ctaSlide(range), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));
  const ctaPath = path.join(OUT_DIR, 'slide-7.jpg');
  await page.screenshot({ path: ctaPath, type: 'jpeg', quality: 92 });
  slidePaths.push(ctaPath);
  console.log('  슬라이드 7/7 (CTA) ✅');

  await browser.close();

  // 설정 저장
  const config = { date: today, range, coverHeadline: data.coverHeadline, top5: data.top5, caption: data.caption, slides: slidePaths };
  fs.writeFileSync(path.join(MEM_DIR, 'config.json'), JSON.stringify(config, null, 2));

  // Telegram 미리보기
  const headlines = data.top5.map((n, i) => `${n.icon} TOP${i + 1}: ${n.title.replace(/\n/g, ' ')}`).join('\n');
  const preview = `🗞️ <b>주간 뉴스 요약 미리보기</b>\n📅 ${range}\n\n${headlines}\n\n` +
    `✅ <b>"올려"</b> → IG+FB 포스팅\n❌ <b>"취소"</b> → 건너뜀`;

  await sendTelegramPhoto(cover, preview);
  console.log('✅ Telegram 미리보기 전송 완료');
  console.log(`   저장: ${MEM_DIR}/config.json`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
