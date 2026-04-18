#!/usr/bin/env node
/**
 * 달커넥트 공감 콘텐츠 일일 후보 선택 + 5장 미리보기
 * 크론: 매일 밤 9pm CST
 *
 * 동작:
 * 1. community_posts DB에서 공감글 선택 (요일별 테마 우선)
 * 2. Gemini로 5장 슬라이드 내용 생성
 * 3. Puppeteer로 5장 이미지 렌더링
 * 4. Telegram 미디어 그룹으로 5장 전송
 */

const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const fs = require('fs');
const FormData = require('form-data');
const https = require('https');
const { askAI } = require('../cron/ai.cjs');

const GOOGLE_AI_KEY = 'AIzaSyAhF8MA0mxt6PfmJMwMGABUNyxXoBnBYO0';

// ── Imagen 일러스트 배경 생성 ─────────────────────────────────
async function genImagenBg(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' },
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GOOGLE_AI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(d);
          const b64 = r.predictions?.[0]?.bytesBase64Encoded;
          if (b64) resolve('data:image/png;base64,' + b64);
          else resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const OUT_DIR = '/tmp/empathy-carousel-today';
const PREVIEW_FILE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data/empathy-preview.json';
const POSTED_FILE  = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data/empathy-posted-ids.json';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID   = '-5280678324';

const DAY_THEMES = {
  0: { label: '관계/가족',     keywords: ['가족','부부','남편','아내','아이','부모'] },
  1: { label: '육아 공감',     keywords: ['아이','아기','육아','엄마','아빠','부모'] },
  2: { label: '이민/비자 고민', keywords: ['비자','이민','영주권','시민권','USCIS','운전면허'] },
  3: { label: '달라스 생활',   keywords: ['달라스','DFW','텍사스','플라노','어빙','캐럴턴'] },
  4: { label: '건강/다이어트', keywords: ['건강','다이어트','운동','식단','병원','보험'] },
  5: { label: '직장/사업 고민', keywords: ['직장','사업','취업','연봉','레이오프','이직'] },
  6: { label: '공감 이야기',   keywords: ['힘들','지쳐','고민','외로','어떻게','걱정'] },
};

function getPostedIds() {
  try { return JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8')); } catch { return []; }
}

// ── 슬라이드 HTML 생성 ──────────────────────────────────────
function buildSlideHtml(slide, idx, total, accent) {
  const bg = slide.bgImage
    ? `url('${slide.bgImage}') center/cover no-repeat`
    : (slide.bg || `linear-gradient(160deg,#0a0f1e 0%,#0d1a36 50%,#0a0f1e 100%)`);
  return `<!DOCTYPE html><html><head>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
  background:${bg};overflow:hidden;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:80px 72px;text-align:center;position:relative;}
${slide.bgImage ? `.overlay{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.55) 50%,rgba(0,0,0,0.72) 100%);}` : ''}
.glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:700px;height:700px;background:radial-gradient(circle,${accent}18 0%,transparent 70%);pointer-events:none;}
.badge{position:absolute;top:64px;left:50%;transform:translateX(-50%);
  font-size:24px;font-weight:700;color:${accent};letter-spacing:1px;white-space:nowrap;}
.slide-num{position:absolute;top:64px;right:72px;font-size:18px;color:rgba(255,255,255,0.3);font-weight:600;}
.emoji{font-size:90px;line-height:1;margin-bottom:24px;}
.title{color:#fff;font-size:54px;font-weight:900;line-height:1.4;white-space:pre-line;word-break:keep-all;margin-bottom:20px;
  ${slide.bgImage ? 'text-shadow:0 2px 12px rgba(0,0,0,0.95),0 0 30px rgba(0,0,0,0.8);' : ''}}
.title em{color:${accent};font-style:normal;}
.divider{width:60px;height:4px;background:${accent};border-radius:2px;margin:20px auto;}
.body{color:rgba(255,255,255,0.88);font-size:30px;line-height:1.8;white-space:pre-line;word-break:keep-all;}
.cta{color:${accent};font-size:36px;font-weight:800;margin-top:24px;}
.brand{position:absolute;bottom:40px;left:0;right:0;
  display:flex;justify-content:center;align-items:center;gap:10px;}
.dot{width:9px;height:9px;background:#34d399;border-radius:50%;}
.brand-txt{color:rgba(255,255,255,0.4);font-size:20px;font-weight:700;}
</style></head><body>
${slide.bgImage ? `<div class="overlay"></div>` : ''}
<div class="glow"></div>
${slide.badge ? `<div class="badge">${slide.badge}</div>` : ''}
<div class="slide-num">${idx+1} / ${total}</div>
${slide.emoji ? `<div class="emoji">${slide.emoji}</div>` : ''}
${slide.title ? `<div class="title">${slide.title}</div>` : ''}
${slide.body && slide.title ? `<div class="divider"></div>` : ''}
${slide.body ? `<div class="body">${slide.body}</div>` : ''}
${slide.cta ? `<div class="cta">${slide.cta}</div>` : ''}
<div class="brand"><div class="dot"></div><div class="brand-txt">DALKONNECT.COM</div></div>
</body></html>`;
}

// ── Gemini로 5장 슬라이드 내용 생성 ─────────────────────────
async function genSlides(post, theme) {
  const prompt = `달커넥트 공감 캐러셀 5장을 만들 거야. 달라스 한인 커뮤니티 글 기반.

원본 글:
제목: ${post.title}
내용: ${(post.content || '').slice(0, 500)}
테마: ${theme.label}

아래 JSON 형식으로 5장 슬라이드 내용 생성 (JSON만 출력):
[
  {
    "badge": "💬 ${theme.label}",
    "emoji": "감정 이모지 1개",
    "title": "공감 제목 (2줄 이내, 핵심만, \\n으로 줄바꿈)",
    "body": "",
    "cta": "",
    "bg": ""
  },
  {
    "badge": "📖 사연",
    "emoji": "",
    "title": "",
    "body": "원본 글 요약 (3~5줄, \\n으로 줄바꿈, 1인칭 느낌으로)",
    "cta": "",
    "bg": "linear-gradient(160deg,#0c0f1c 0%,#111d38 50%,#0c0f1c 100%)"
  },
  {
    "badge": "🤝 공감해요",
    "emoji": "",
    "title": "",
    "body": "달라스 한인들이 공감할 만한 현실 (3~4줄, 구체적으로)",
    "cta": "",
    "bg": "linear-gradient(160deg,#0a0f20 0%,#0d1a3c 50%,#0a0f20 100%)"
  },
  {
    "badge": "💡 이렇게 해보세요",
    "emoji": "",
    "title": "",
    "body": "실용적인 팁 3~4개 (✓ 형식, \\n으로 구분)",
    "cta": "",
    "bg": "linear-gradient(160deg,#0a0c1a 0%,#101838 50%,#0a0c1a 100%)"
  },
  {
    "badge": "",
    "emoji": "",
    "title": "여러분의 경험도\\n댓글로 나눠주세요!",
    "body": "",
    "cta": "👇 dalkonnect.com/community",
    "bg": ""
  }
]`;

  const raw = await askAI(prompt, { maxTokens: 1500, thinkingBudget: 0 });
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('슬라이드 JSON 파싱 실패');
  return JSON.parse(match[0]);
}

// ── 5장 렌더링 ──────────────────────────────────────────────
async function renderSlides(slides, accent) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  // 기존 파일 정리
  fs.readdirSync(OUT_DIR).forEach(f => fs.unlinkSync(`${OUT_DIR}/${f}`));

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const files = [];
  for (let i = 0; i < slides.length; i++) {
    const html = buildSlideHtml(slides[i], i, slides.length, accent);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));
    const out = `${OUT_DIR}/slide-${i+1}.jpg`;
    await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
    files.push(out);
    console.log(`✅ slide-${i+1}.jpg`);
  }
  await browser.close();
  return files;
}

// ── Telegram 사진 1장 전송 ───────────────────────────────────
function sendPhoto(filePath, caption) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('photo', fs.createReadStream(filePath), 'slide.jpg');
    if (caption) form.append('caption', caption);

    const https = require('https');
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: 'POST',
      headers: form.getHeaders(),
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const r = JSON.parse(d);
        if (!r.ok) return reject(new Error(`Telegram 오류: ${JSON.stringify(r)}`));
        resolve(r);
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

// ── 5장 순차 전송 ────────────────────────────────────────────
async function sendMediaGroup(files, caption) {
  for (let i = 0; i < files.length; i++) {
    await sendPhoto(files[i], i === 0 ? caption : null);
    console.log(`✅ slide-${i+1} 전송`);
    if (i < files.length - 1) await new Promise(r => setTimeout(r, 500));
  }
  console.log('✅ 텔레그램 5장 전송 완료');
}

// ── 전략 기반 테마 보정 ──────────────────────────────────────
function getStrategyBoostedTheme(dayOfWeek) {
  const base = DAY_THEMES[dayOfWeek];
  try {
    const strategy = JSON.parse(fs.readFileSync(
      '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data/strategy.json', 'utf8'
    ));
    const top = strategy.top_empathy_themes?.[0];
    if (!top) return base;
    // 전략에서 최고 성과 테마가 있으면 해당 키워드를 앞에 추가
    const boost = {
      '육아/가족':  ['아이','아기','육아','엄마','아빠','가족','부부'],
      '이민/비자':  ['비자','이민','영주권','시민권','그린카드'],
      '달라스생활': ['달라스','DFW','텍사스'],
      '직장/사업':  ['직장','사업','취업','연봉','레이오프'],
    }[top];
    if (boost) return { ...base, keywords: [...new Set([...boost, ...base.keywords])] };
  } catch (_) {}
  return base;
}

// ── 메인 ────────────────────────────────────────────────────
(async () => {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const dayOfWeek = new Date().getDay();
  const theme = getStrategyBoostedTheme(dayOfWeek);
  const postedIds = getPostedIds();

  const forceId = process.env.FORCE_POST_ID;
  const { rows } = forceId
    ? await pool.query(`SELECT id, title, content, category FROM community_posts WHERE id = $1`, [forceId])
    : await pool.query(`
        SELECT id, title, content, category
        FROM community_posts
        WHERE LENGTH(TRIM(COALESCE(content,''))) > 80
        AND id != ALL($1::text[])
        ORDER BY RANDOM()
        LIMIT 50
      `, [postedIds.length > 0 ? postedIds : ['']]);
  await pool.end();

  let best = rows.find(r => {
    const text = (r.title + ' ' + r.content).toLowerCase();
    return theme.keywords.some(k => text.includes(k));
  }) || rows[0];

  if (!best) { console.log('⚠️ 오늘 후보 없음'); process.exit(0); }
  console.log('선택:', best.title.substring(0, 60));

  // 슬라이드 내용 생성
  const slides = await genSlides(best, theme);
  const ACCENT = '#f9a8d4';

  // Imagen으로 표지 배경 생성
  console.log('🎨 Imagen 배경 생성 중...');
  const imgPrompt = await askAI(
    `달라스 한인 커뮤니티 공감 콘텐츠 표지 배경 이미지 프롬프트 (영어로).
글 주제: ${best.title}
테마: ${theme.label}
스타일 규칙: soft watercolor illustration, NO people, NO faces, absolutely NO text, NO letters, NO words, NO signs, NO labels, NO writing of any kind, objects and scenery only, warm Korean aesthetic, muted pastel tones, emotionally warm, blurred soft background suitable for text overlay
예시: "Soft watercolor illustration of a cozy Korean kitchen with warm amber lighting, bowls of food, steam rising, no people, no text, no signs, blurred soft style"
위 예시처럼 한 문장 프롬프트만 출력 (반드시 "no text, no signs" 포함):`,
    { maxTokens: 120, thinkingBudget: 0 }
  );
  const bgImage = await genImagenBg(imgPrompt.trim());
  if (bgImage) {
    slides[0].bgImage = bgImage;
    console.log('✅ Imagen 배경 생성 완료');
  } else {
    console.log('⚠️ Imagen 실패 → 그라디언트 폴백');
  }

  // 렌더링
  const files = await renderSlides(slides, ACCENT);

  // 미리보기 저장
  fs.mkdirSync('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/data', { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, JSON.stringify({
    id: best.id, title: best.title, content: best.content,
    category: best.category, theme: theme.label,
    date: new Date().toISOString().slice(0, 10),
    slideFiles: files,
  }));

  // 5장 Telegram 전송
  const caption = `📅 오늘 공감 콘텐츠 미리보기\n\n💬 ${theme.label}\n"${best.title.substring(0, 50)}"\n\n👉 올리려면 '올려' 라고 해주세요!`;
  await sendMediaGroup(files, caption);

})().catch(e => { console.error('❌', e.message); process.exit(1); });
