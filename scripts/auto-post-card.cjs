#!/usr/bin/env node
/**
 * 달커넥트 자동 뉴스 카드 선택 + 포스팅
 * 크론에서 호출: node scripts/auto-post-card.cjs
 * 
 * 동작:
 * 1. DB에서 오늘 아직 안 올린 뉴스 중 임팩트 있는 거 1개 선택
 * 2. gen-news-cards-v2.cjs 패턴으로 카드 생성
 * 3. IG 포스팅
 * 4. posted_ids.json에 기록 (중복 방지)
 */
const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));
const fs = require('fs');
const admin = require('firebase-admin');
const path = require('path');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const POSTED_FILE = path.join(BASE, 'data/ig-posted-ids.json');
const OUT_DIR = '/Users/aaron/.openclaw/workspace/memory';
const BUCKET = 'konnect-ceedb.firebasestorage.app';

// 이미 포스팅한 ID 불러오기
function getPostedIds() {
  try { return JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8')); } catch { return []; }
}
function savePostedId(id) {
  const ids = getPostedIds();
  ids.push(id);
  fs.mkdirSync(path.dirname(POSTED_FILE), { recursive: true });
  fs.writeFileSync(POSTED_FILE, JSON.stringify(ids, null, 2));
}

const envLocal = fs.readFileSync(`${BASE}/.env.local`, 'utf8');
const TOKEN = envLocal.match(/FACEBOOK_PAGE_ACCESS_TOKEN=(.+)/)?.[1]?.trim();
const IG_ID = '17841440398453483';

if (!admin.apps.length) {
  const sa = JSON.parse(fs.readFileSync(`${BASE}/konnect-firebase-key.json`, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: BUCKET });
}
const bucket = admin.storage().bucket();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 카테고리별 Pexels 이미지 (Unsplash 금지!)
const PEXELS_FALLBACK = {
  '로컬뉴스':  'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?w=1080',
  '월드뉴스':  'https://images.pexels.com/photos/335393/pexels-photo-335393.jpeg?w=1080',
  '미국뉴스':  'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?w=1080',
  '한국뉴스':  'https://images.pexels.com/photos/2115367/pexels-photo-2115367.jpeg?w=1080',
  '건강':      'https://images.pexels.com/photos/40751/running-runner-long-distance-fitness-40751.jpeg?w=1080',
  '스포츠':    'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?w=1080',
  'K-POP':     'https://images.pexels.com/photos/2115367/pexels-photo-2115367.jpeg?w=1080',
  '이민/비자': 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?w=1080',
  'default':   'https://images.pexels.com/photos/335393/pexels-photo-335393.jpeg?w=1080',
};

const CATEGORY_CONFIG = {
  '로컬뉴스':  { accent: '#ef4444', badge: '📡 DFW 로컬',  badge2: '🔴 속보' },
  '월드뉴스':  { accent: '#f97316', badge: '🌍 월드뉴스',  badge2: '🔴 속보' },
  '미국뉴스':  { accent: '#3b82f6', badge: '🇺🇸 미국뉴스', badge2: '🔴 속보' },
  '한국뉴스':  { accent: '#a855f7', badge: '🇰🇷 한국뉴스', badge2: '🔴 속보' },
  '건강':      { accent: '#22c55e', badge: '💊 건강정보',  badge2: '🌿 웰빙' },
  '스포츠':    { accent: '#fbbf24', badge: '⚽ 스포츠',    badge2: '🏆 최신' },
  'K-POP':     { accent: '#ec4899', badge: '🎵 K-POP',     badge2: '💜 한류' },
  '이민/비자': { accent: '#60a5fa', badge: '🛂 이민/비자', badge2: '📋 업데이트' },
  'default':   { accent: '#2ED8A3', badge: '📰 뉴스',      badge2: '🔴 속보' },
};

async function getImageB64(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return 'data:image/jpeg;base64,' + Buffer.from(buf).toString('base64');
  } catch { return null; }
}

async function genCard(news) {
  const cfg = CATEGORY_CONFIG[news.category] || CATEGORY_CONFIG.default;
  const fallbackUrl = PEXELS_FALLBACK[news.category] || PEXELS_FALLBACK.default;

  let imgB64 = null;
  if (news.thumbnail_url) imgB64 = await getImageB64(news.thumbnail_url);
  if (!imgB64) imgB64 = await getImageB64(fallbackUrl);

  const bgCss = imgB64
    ? `background:url('${imgB64}') center/cover no-repeat;`
    : `background:linear-gradient(160deg,#0d1117 0%,#1a1a2e 100%);`;

  const rawTitle = news.title.replace(/^\[.*?\]\s*/g, '').trim();
  const titleShort = rawTitle.length > 55 ? rawTitle.substring(0, 55) + '…' : rawTitle;
  const titleHtml = titleShort
    .replace(/['''""]([^''""\n]{2,15})['''""]/, `<span style="color:${cfg.accent}">'$1'</span>`)
    .replace(/「([^」]{2,15})」/, `<span style="color:${cfg.accent}">「$1」</span>`);
  const summary = (news.content || '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim().substring(0, 95);

  const html = `<!DOCTYPE html><html><head>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;${bgCss}position:relative;}
.overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.5) 30%,rgba(0,0,0,0.75) 60%,rgba(0,0,0,0.97) 100%);}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:48px 52px;gap:28px;}
.badges{display:flex;gap:12px;justify-content:center;}
.badge-main{background:${cfg.accent};border-radius:50px;padding:10px 26px;font-size:26px;font-weight:800;color:#fff;}
.badge-sub{background:rgba(0,0,0,0.65);border:1.5px solid rgba(255,255,255,0.25);border-radius:50px;padding:10px 22px;font-size:24px;font-weight:700;color:#fff;}
.bottom{display:flex;flex-direction:column;gap:18px;align-items:center;text-align:center;width:100%;}
.accent-bar{width:56px;height:5px;background:${cfg.accent};border-radius:3px;}
.headline{font-size:52px;font-weight:900;color:#fff;line-height:1.4;word-break:keep-all;text-align:center;max-width:860px;text-shadow:0 2px 20px rgba(0,0,0,0.9);}
.summary{font-size:28px;color:rgba(255,255,255,0.78);line-height:1.65;word-break:keep-all;text-align:center;max-width:880px;}
.meta{display:flex;gap:10px;justify-content:center;}
.meta-pill{background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.2);border-radius:50px;padding:7px 20px;font-size:22px;color:rgba(255,255,255,0.7);}
.cta-row{display:flex;justify-content:center;gap:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.12);}
.cta-btn{background:transparent;border:2px solid ${cfg.accent};border-radius:50px;padding:12px 32px;font-size:24px;font-weight:700;color:${cfg.accent};}
.brand{font-size:22px;font-weight:700;color:rgba(255,255,255,0.45);display:flex;align-items:center;gap:8px;}
.brand-dot{width:10px;height:10px;background:#2ED8A3;border-radius:50%;}
</style></head><body>
<div class="overlay"></div>
<div class="wrap">
  <div class="badges"><div class="badge-main">${cfg.badge}</div><div class="badge-sub">${cfg.badge2}</div></div>
  <div class="bottom">
    <div class="accent-bar"></div>
    <div class="headline">${titleHtml}</div>
    <div class="summary">${summary}</div>
    <div class="meta"><div class="meta-pill">🗞️ ${news.source || 'dalkonnect.com'}</div><div class="meta-pill">📅 ${new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'}).replace('. ','월 ').replace('.','')}일</div></div>
    <div class="cta-row"><div class="cta-btn">더 알아보기 👉 dalkonnect.com</div><div class="brand"><div class="brand-dot"></div>DALKONNECT.COM</div></div>
  </div>
</div>
</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  const outPath = `${OUT_DIR}/autocard-${news.id.substring(0,8)}.png`;
  await page.screenshot({ path: outPath });
  await browser.close();
  return outPath;
}

async function buildCaption(news) {
  const rawTitle = news.title.replace(/^\[.*?\]\s*/g, '').trim();
  const summary = (news.content || '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim().substring(0, 120);
  const tags = {
    '로컬뉴스':  '#달커넥트 #달라스뉴스 #DFW한인 #달라스한인 #DalKonnect',
    '월드뉴스':  '#달커넥트 #월드뉴스 #국제뉴스 #달라스한인 #DalKonnect',
    '미국뉴스':  '#달커넥트 #미국뉴스 #달라스한인 #DFW한인 #DalKonnect',
    '한국뉴스':  '#달커넥트 #한국뉴스 #달라스한인 #DFW한인 #DalKonnect',
    '건강':      '#달커넥트 #건강정보 #달라스한인 #웰빙 #DalKonnect',
    '스포츠':    '#달커넥트 #스포츠 #달라스한인 #DFW한인 #DalKonnect',
    'K-POP':     '#달커넥트 #KPOP #한류 #달라스한인 #DalKonnect',
    '이민/비자': '#달커넥트 #이민비자 #USCIS #달라스한인 #DalKonnect',
  };
  return `${rawTitle}\n\n${summary}\n\n👉 전체 기사 → dalkonnect.com/news\n${tags[news.category] || '#달커넥트 #달라스한인 #DalKonnect'}`;
}

(async () => {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const postedIds = getPostedIds();

  // 우선순위: 로컬 > 월드/긴급 > 한국 > 미국 > 건강/기타
  // 오늘 수집된 것 중 아직 안 올린 것
  const { rows } = await pool.query(`
    SELECT id, title, content, category, thumbnail_url, source
    FROM news
    WHERE created_at > NOW() - INTERVAL '18 hours'
    AND LENGTH(TRIM(COALESCE(content,''))) > 80
    AND title NOT LIKE '[포토]%'
    AND category NOT IN ('육아','패션/뷰티','취업/사업','세금/재정')
    ORDER BY
      CASE category
        WHEN '로컬뉴스' THEN 1
        WHEN '월드뉴스' THEN 2
        WHEN '이민/비자' THEN 3
        WHEN '한국뉴스' THEN 4
        WHEN '미국뉴스' THEN 5
        WHEN '건강' THEN 6
        WHEN '스포츠' THEN 7
        ELSE 8
      END,
      created_at DESC
    LIMIT 50
  `);
  await pool.end();

  const news = rows.find(r => !postedIds.includes(r.id));
  if (!news) {
    console.log('⚠️ 오늘 새 뉴스 없음 — 건너뜀');
    process.exit(0);
  }

  console.log('선택:', news.category, '|', news.title.substring(0, 50));

  const imgPath = await genCard(news);
  const caption = await buildCaption(news);

  // Firebase 업로드
  const destName = `autocard-${Date.now()}.png`;
  await bucket.upload(imgPath, { destination: `news-cards/${destName}`, metadata: { contentType: 'image/png' } });
  const [imgUrl] = await bucket.file(`news-cards/${destName}`).getSignedUrl({ action: 'read', expires: Date.now() + 86400000 });

  // IG 포스팅
  const r1 = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: imgUrl, caption, access_token: TOKEN })
  });
  const d1 = await r1.json();
  if (!d1.id) throw new Error('컨테이너 실패: ' + JSON.stringify(d1));

  for (let i = 0; i < 8; i++) {
    await sleep(5000);
    const s = await (await fetch(`https://graph.facebook.com/v19.0/${d1.id}?fields=status_code&access_token=${TOKEN}`)).json();
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR') throw new Error('처리 에러');
  }

  const r2 = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: d1.id, access_token: TOKEN })
  });
  const d2 = await r2.json();
  if (!d2.id) throw new Error('게시 실패: ' + JSON.stringify(d2));

  savePostedId(news.id);
  console.log('✅ 포스팅 완료! IG ID:', d2.id, '|', news.title.substring(0, 40));
})().catch(e => { console.error('❌', e.message); process.exit(1); });
