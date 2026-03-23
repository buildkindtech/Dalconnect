#!/usr/bin/env node
/**
 * 달커넥트 공감 콘텐츠 일일 후보 선택 + 표지 미리보기
 * 크론: 매일 밤 9pm CST
 * 
 * 동작:
 * 1. DB에서 공감 가능한 뉴스/커뮤니티 글 선택 (요일별 주제)
 * 2. 표지 슬라이드 1장 생성
 * 3. DalKonnect 텔레그램 방으로 전송 + "올려라고 하면 포스팅"
 */

const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));
const fs = require('fs');
const { execSync } = require('child_process');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const OUT = '/Users/aaron/.openclaw/workspace/memory/empathy-preview-today.png';
const PREVIEW_FILE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data/empathy-preview.json';
const POSTED_FILE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data/empathy-posted-ids.json';

// 요일별 주제
const DAY_THEMES = {
  0: { label: '관계/가족', cats: ['육아','가족'], keywords: ['가족','부부','남편','아내','아이','부모'] },
  1: { label: '육아 공감', cats: ['육아'], keywords: ['아이','아기','육아','엄마','아빠','부모'] },
  2: { label: '이민/비자 고민', cats: ['이민/비자'], keywords: ['비자','이민','영주권','시민권','USCIS'] },
  3: { label: '달라스 생활', cats: ['로컬뉴스','달라스'], keywords: ['달라스','DFW','텍사스'] },
  4: { label: '건강/다이어트', cats: ['건강'], keywords: ['건강','다이어트','운동','식단','살'] },
  5: { label: '직장/사업 고민', cats: ['취업/사업'], keywords: ['직장','사업','취업','돈','연봉'] },
  6: { label: '공감 이야기', cats: ['육아','건강','취업/사업'], keywords: ['힘들','지쳐','고민','어떻게'] },
};

function getPostedIds() {
  try { return JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8')); } catch { return []; }
}

async function getB64(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return 'data:image/jpeg;base64,' + Buffer.from(buf).toString('base64');
  } catch { return null; }
}

// 표지 슬라이드 생성
async function genCover(news, theme) {
  const imgB64 = await getB64('https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?w=1080');
  const bgCss = imgB64
    ? `background:url('${imgB64}') center/cover no-repeat;`
    : `background:linear-gradient(160deg,#1a0a2e 0%,#2d1b4e 100%);`;

  const title = news.title.replace(/^\[.*?\]\s*/g,'').trim();
  const titleShort = title.length > 36 ? title.substring(0,36)+'…' : title;

  const html = `<!DOCTYPE html><html><head>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;${bgCss}position:relative;}
.overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.45) 35%,rgba(0,0,0,0.78) 65%,rgba(0,0,0,0.97) 100%);}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:56px;gap:28px;text-align:center;}
.badge{background:#ec4899;border-radius:50px;padding:12px 32px;font-size:26px;font-weight:800;color:#fff;}
.emoji{font-size:96px;line-height:1;}
.title{font-size:54px;font-weight:900;color:#fff;line-height:1.4;word-break:keep-all;max-width:860px;text-shadow:0 2px 20px rgba(0,0,0,0.9);}
.highlight{color:#f9a8d4;}
.subtitle{font-size:28px;color:rgba(255,255,255,0.75);line-height:1.6;max-width:800px;}
.dots{display:flex;gap:8px;justify-content:center;}
.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.3);}
.dot.active{background:#ec4899;width:24px;border-radius:4px;}
.brand{position:absolute;bottom:40px;left:0;right:0;text-align:center;font-size:20px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:2px;display:flex;justify-content:center;gap:8px;align-items:center;}
.bd{width:8px;height:8px;background:#2ED8A3;border-radius:50%;}
</style></head><body>
<div class="overlay"></div>
<div class="wrap">
  <div class="badge">💬 ${theme.label}</div>
  <div class="emoji">😮‍💨</div>
  <div class="title">"<span class="highlight">${titleShort}</span>"</div>
  <div class="subtitle">이런 경험 있으신가요?<br>넘겨서 읽어보세요 →</div>
  <div class="dots">
    <div class="dot active"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
  </div>
</div>
<div class="brand"><div class="bd"></div>DALKONNECT.COM</div>
</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT });
  await browser.close();
  return OUT;
}

(async () => {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const dayOfWeek = new Date().getDay();
  const theme = DAY_THEMES[dayOfWeek];
  const postedIds = getPostedIds();

  // 공감 가능한 뉴스 선택
  const { rows } = await pool.query(`
    SELECT id, title, content, category
    FROM news
    WHERE category = ANY($1)
    AND LENGTH(TRIM(COALESCE(content,''))) > 100
    AND title NOT LIKE '[포토]%'
    AND created_at > NOW() - INTERVAL '48 hours'
    ORDER BY created_at DESC
    LIMIT 30
  `, [theme.cats]);
  await pool.end();

  // 키워드 매칭으로 공감글 찾기
  let best = rows.find(r => {
    if (postedIds.includes(r.id)) return false;
    const text = (r.title + r.content).toLowerCase();
    return theme.keywords.some(k => text.includes(k));
  }) || rows.find(r => !postedIds.includes(r.id));

  if (!best) {
    console.log('⚠️ 오늘 후보 없음');
    process.exit(0);
  }

  console.log('선택:', best.title.substring(0,60));

  // 표지 생성
  await genCover(best, theme);

  // 미리보기 저장 (내일 "올려" 받으면 이걸 읽어서 5장 생성)
  fs.mkdirSync('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data', { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, JSON.stringify({ id: best.id, title: best.title, content: best.content, category: best.category, theme: theme.label, date: new Date().toISOString().slice(0,10) }));

  // 텔레그램 전송
  const OpenClaw = require('/opt/homebrew/lib/node_modules/openclaw/dist/cli.js');

  // openclaw CLI로 전송
  execSync(`openclaw send --channel telegram --to -5280678324 --file "${OUT}" --caption "📅 내일 공감 콘텐츠 후보예요!\n\n💬 ${theme.label}\n\n"${best.title.substring(0,50)}"\n\n5장 캐러셀로 만들 예정입니다.\n👉 올리려면 '올려' 라고 해주세요!"`, { stdio: 'inherit' });

})().catch(e => { console.error('❌', e.message); process.exit(1); });
