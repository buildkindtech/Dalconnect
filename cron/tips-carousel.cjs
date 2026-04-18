#!/usr/bin/env node
/**
 * DalKonnect 달라스 생활 꿀팁 캐러셀 (화/금 오전 11am)
 *
 * Gemini로 오늘 주제 + 꿀팁 생성 → Puppeteer 5장 슬라이드 → Telegram 미리보기
 * Aaron "올려" → tips-carousel-post.cjs 실행
 *
 * 주제 풀: 재산세 / 이민비자 / 텍사스 운전 / 의료보험 / 자녀교육 /
 *          집 구매 / 직장 취업 / H-Mart 쇼핑 / 날씨 대비 / 한국 송금
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';
const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const today = new Date().toISOString().slice(0, 10);
const mmdd = today.slice(5).replace('-', '');
const OUT_DIR = path.join('/tmp', `tips-${mmdd}`);
const MEM_DIR = path.join(BASE, 'memory', 'tips-carousel', today);

// ─── 유틸 ────────────────────────────────────────────────────
function readEnv(file, key) {
  try {
    return (fs.readFileSync(file, 'utf8').match(new RegExp(`${key}=(.+)`)) || [])[1]?.trim();
  } catch { return null; }
}

const GEMINI_KEY = readEnv('/Users/aaron/.claude/api-keys.env', 'GOOGLE_AI_KEY')
  || readEnv(path.join(BASE, '.env.local'), 'GOOGLE_AI_KEY');

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 1500 },
  });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const j = JSON.parse(d);
        res(j.candidates?.[0]?.content?.parts?.[0]?.text || '');
      });
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
    }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
    req.on('error', rej); form.pipe(req);
  });
}

async function sendTelegramText(text) {
  const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
    req.on('error', rej); req.write(body); req.end();
  });
}

// ─── 슬라이드 HTML ───────────────────────────────────────────
const THEME = {
  bg: 'linear-gradient(160deg, #0a0c14 0%, #102030 50%, #0a0c14 100%)',
  accent: '#22d3ee',
  accentDim: 'rgba(34,211,238,0.15)',
};

function coverSlide(topic, emoji, tagline) {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${THEME.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px;text-align:center;position:relative;overflow:hidden;}
.badge{background:${THEME.accentDim};border:1px solid ${THEME.accent};color:${THEME.accent};
font-size:24px;font-weight:700;padding:10px 28px;border-radius:50px;margin-bottom:40px;letter-spacing:2px;}
.emoji{font-size:100px;margin-bottom:28px;}
.title{color:#fff;font-size:62px;font-weight:900;line-height:1.3;margin-bottom:20px;white-space:pre-line;}
.tagline{color:rgba(255,255,255,0.65);font-size:32px;font-weight:400;line-height:1.5;margin-bottom:48px;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${THEME.accent};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.6);font-size:22px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="badge">💡 달라스 생활 꿀팁</div>
<div class="emoji">${emoji}</div>
<div class="title">${topic}</div>
<div class="tagline">${tagline}</div>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

function tipSlide(num, total, heading, body, icon) {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${THEME.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px 88px;text-align:center;position:relative;overflow:hidden;}
.num{color:${THEME.accent};font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:20px;}
.icon{font-size:72px;margin-bottom:24px;}
.heading{color:#fff;font-size:48px;font-weight:900;line-height:1.35;margin-bottom:32px;white-space:pre-line;}
.divider{width:56px;height:4px;background:${THEME.accent};border-radius:2px;margin:0 auto 32px;}
.tips{list-style:none;display:flex;flex-direction:column;gap:18px;max-width:860px;width:100%;}
.tip{background:rgba(255,255,255,0.06);border-left:4px solid ${THEME.accent};
border-radius:8px;padding:18px 24px;text-align:left;color:rgba(255,255,255,0.88);
font-size:28px;line-height:1.55;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${THEME.accent};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.45);font-size:20px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="num">TIP ${num} / ${total}</div>
<div class="icon">${icon}</div>
<div class="heading">${heading}</div>
<div class="divider"></div>
<ul class="tips">
  ${lines.map(l => `<li class="tip">${l}</li>`).join('\n  ')}
</ul>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

function ctaSlide() {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
background:${THEME.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:80px;text-align:center;position:relative;overflow:hidden;}
.icon{font-size:80px;margin-bottom:32px;}
.title{color:#fff;font-size:58px;font-weight:900;line-height:1.3;margin-bottom:20px;}
.sub{color:rgba(255,255,255,0.65);font-size:30px;line-height:1.6;margin-bottom:48px;}
.cta{background:${THEME.accent};color:#000;font-size:30px;font-weight:900;
padding:18px 52px;border-radius:50px;margin-bottom:20px;}
.link{color:${THEME.accent};font-size:26px;font-weight:600;margin-bottom:48px;}
.hashtags{color:rgba(255,255,255,0.35);font-size:19px;line-height:1.8;}
.brand{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);
display:flex;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:${THEME.accent};border-radius:50%;}
.brand-text{color:rgba(255,255,255,0.5);font-size:22px;font-weight:600;white-space:nowrap;}
</style></head><body>
<div class="icon">🔔</div>
<div class="title">더 많은 달라스 꿀팁</div>
<div class="sub">팔로우하면 매주 화·금<br>달라스 한인 생활 꿀팁을 받아보실 수 있어요</div>
<div class="cta">👉 팔로우하기</div>
<div class="link">dalkonnect.com</div>
<div class="hashtags">#달라스한인 #달커넥트 #DFW한인 #달라스생활 #텍사스생활</div>
<div class="brand"><div class="dot"></div><div class="brand-text">DalKonnect — 달라스 한인 커뮤니티</div></div>
</body></html>`;
}

// ─── 메인 ────────────────────────────────────────────────────
(async () => {
  console.log(`[${today}] 꿀팁 캐러셀 생성 시작`);
  [OUT_DIR, MEM_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  // Gemini로 오늘 주제 + 팁 생성
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
  const prompt = `달라스 DFW 거주 한인을 위한 실용적인 생활 꿀팁 캐러셀을 만든다.

오늘: ${today} (${dayOfWeek}요일)

주제 풀 (중 하나 선택 — 계절/뉴스 트렌드에 맞게):
- 텍사스 재산세 절약법
- H1B/영주권 준비 팁
- 텍사스 자동차 등록/보험 꿀팁
- 미국 의료보험 활용법
- DFW 자녀 학교/과외 꿀팁
- 달라스 집 구매 첫걸음
- 텍사스 취업/이직 팁
- H-Mart/코마트 쇼핑 꿀팁
- 텍사스 날씨 대비 생활법
- 한국 가족 송금 절약법

반드시 아래 규칙을 지켜라:
- JSON 문자열 값 안에 줄바꿈(\\n) 절대 금지
- 모든 텍스트는 한 줄로
- 코드블록 없이 JSON만 출력

{"topic":"주제(20자이내)","emoji":"이모지","tagline":"부제(30자이내)","tips":[{"heading":"팁제목(20자이내)","icon":"이모지","bullets":["내용1(25자이내)","내용2(25자이내)","내용3(25자이내)"]},{"heading":"팁제목","icon":"이모지","bullets":["내용1","내용2","내용3"]},{"heading":"팁제목","icon":"이모지","bullets":["내용1","내용2","내용3"]}],"caption":"캡션(줄바꿈없이한줄)"}`;

  console.log('  Gemini로 주제 생성 중...');
  const raw = await callGemini(prompt);
  // { ... } 추출 후 파싱 재시도
  let data;
  const start = raw.indexOf('{');
  if (start === -1) throw new Error('Gemini JSON 없음: ' + raw.slice(0, 200));
  // 중괄호 depth 추적으로 정확한 end 찾기
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
    throw new Error('Gemini JSON 파싱 오류: ' + e.message.slice(0, 100) + '\n원본: ' + raw.slice(start, Math.min(start + 300, end + 1)));
  }
  console.log(`  주제: ${data.topic}`);

  // 슬라이드 생성
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const slidePaths = [];

  // 슬라이드 1: 표지
  await page.setContent(coverSlide(data.topic, data.emoji, data.tagline), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));
  const cover = path.join(OUT_DIR, 'slide-1.jpg');
  await page.screenshot({ path: cover, type: 'jpeg', quality: 92 });
  slidePaths.push(cover);
  console.log('  슬라이드 1/5 (표지) ✅');

  // 슬라이드 2-4: 팁
  for (let i = 0; i < data.tips.length; i++) {
    const tip = data.tips[i];
    const body = tip.bullets.join('\n');
    await page.setContent(tipSlide(i + 1, 3, tip.heading, body, tip.icon), { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));
    const p = path.join(OUT_DIR, `slide-${i + 2}.jpg`);
    await page.screenshot({ path: p, type: 'jpeg', quality: 92 });
    slidePaths.push(p);
    console.log(`  슬라이드 ${i + 2}/5 ✅`);
  }

  // 슬라이드 5: CTA
  await page.setContent(ctaSlide(), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));
  const ctaPath = path.join(OUT_DIR, 'slide-5.jpg');
  await page.screenshot({ path: ctaPath, type: 'jpeg', quality: 92 });
  slidePaths.push(ctaPath);
  console.log('  슬라이드 5/5 (CTA) ✅');

  await browser.close();

  // 설정 저장
  const config = { date: today, topic: data.topic, emoji: data.emoji, tagline: data.tagline, tips: data.tips, caption: data.caption, slides: slidePaths };
  fs.writeFileSync(path.join(MEM_DIR, 'config.json'), JSON.stringify(config, null, 2));

  // Telegram 미리보기 (표지 + 텍스트)
  const preview = `🔔 <b>꿀팁 캐러셀 미리보기</b> (${today})\n\n` +
    `${data.emoji} <b>${data.topic}</b>\n${data.tagline}\n\n` +
    data.tips.map((t, i) => `${t.icon} TIP ${i + 1}: ${t.heading}`).join('\n') +
    `\n\n✅ <b>"올려"</b> → IG+FB 포스팅\n❌ <b>"취소"</b> → 건너뜀`;

  await sendTelegramPhoto(cover, preview);
  console.log('✅ Telegram 미리보기 전송 완료');
  console.log(`   저장: ${MEM_DIR}/config.json`);
})().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
