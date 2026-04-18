#!/usr/bin/env node
/**
 * 아침 브리핑 Phase 3b — 제너릭 썸네일 생성기
 *
 * 사용법:
 *   node briefing-thumbnail.cjs YYYY-MM-DD
 *
 * 요구 파일:
 *   memory/morning-reels/YYYY-MM-DD/briefing-config.json
 *
 * 생성 파일:
 *   memory/morning-reels/YYYY-MM-DD/thumbnail.png
 *   memory/morning-reels/YYYY-MM-DD/thumbnail.jpg
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node briefing-thumbnail.cjs YYYY-MM-DD');
  process.exit(1);
}

const DATE_DIR = path.join(BASE, 'memory', 'morning-reels', dateArg);
const CONFIG_PATH = path.join(DATE_DIR, 'briefing-config.json');
const THUMB_PNG = path.join(DATE_DIR, 'thumbnail.png');
const THUMB_JPG = path.join(DATE_DIR, 'thumbnail.jpg');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ briefing-config.json 없음: ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const slides = config.slides || [];

// 요일별 색상 테마
const DAY_THEMES = {
  0: { // 일 — 따뜻한 인디고
    bg: 'linear-gradient(180deg,#0e0a2e 0%,#1a1050 40%,#0e0a2e 100%)',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.08)',
    line: '#a78bfa',
  },
  1: { // 월 — 딥 블루
    bg: 'linear-gradient(180deg,#060f2e 0%,#0d1f5c 40%,#060f2e 100%)',
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.08)',
    line: '#60a5fa',
  },
  2: { // 화 — 딥 퍼플
    bg: 'linear-gradient(180deg,#150a2e 0%,#2a1250 40%,#150a2e 100%)',
    accent: '#c084fc',
    glow: 'rgba(192,132,252,0.08)',
    line: '#c084fc',
  },
  3: { // 수 — 딥 틸
    bg: 'linear-gradient(180deg,#031a1a 0%,#073535 40%,#031a1a 100%)',
    accent: '#2dd4bf',
    glow: 'rgba(45,212,191,0.08)',
    line: '#2dd4bf',
  },
  4: { // 목 — 딥 그린
    bg: 'linear-gradient(180deg,#051a0a 0%,#0c3318 40%,#051a0a 100%)',
    accent: '#4ade80',
    glow: 'rgba(74,222,128,0.08)',
    line: '#4ade80',
  },
  5: { // 금 — 딥 앰버
    bg: 'linear-gradient(180deg,#1a0e03 0%,#3a2006 40%,#1a0e03 100%)',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.08)',
    line: '#fbbf24',
  },
  6: { // 토 — 딥 로즈
    bg: 'linear-gradient(180deg,#1a0512 0%,#380d28 40%,#1a0512 100%)',
    accent: '#f472b6',
    glow: 'rgba(244,114,182,0.08)',
    line: '#f472b6',
  },
};

// 날씨 설명 → 이모지
function weatherEmoji(desc) {
  if (!desc) return '🌤️';
  const d = desc.toLowerCase();
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('blizzard')) return '🌨️';
  if (d.includes('snow') || d.includes('sleet') || d.includes('ice')) return '❄️';
  if (d.includes('fog') || d.includes('mist')) return '🌫️';
  if (d.includes('heavy rain') || d.includes('torrential')) return '🌧️';
  if (d.includes('patchy rain') || d.includes('light rain') || d.includes('drizzle') || d.includes('shower')) return '🌦️';
  if (d.includes('rain') || d.includes('precip')) return '🌧️';
  if (d.includes('overcast')) return '☁️';
  if (d.includes('cloudy')) return '⛅';
  if (d.includes('partly cloudy') || d.includes('partly sunny')) return '⛅';
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('wind') || d.includes('breezy')) return '🌬️';
  return '🌤️';
}

// 날씨 °F 표시
function weatherLabel(w) {
  if (!w) return '';
  const minF = w.minF || Math.round(w.minC * 9/5 + 32);
  const maxF = w.maxF || Math.round(w.maxC * 9/5 + 32);
  return `${minF}°F — ${maxF}°F`;
}

const dayOfWeek = new Date(dateArg + 'T12:00:00').getDay();
const theme = DAY_THEMES[dayOfWeek];
const wEmoji = weatherEmoji(config.weather?.desc);
const wLabel = weatherLabel(config.weather);

// 카테고리 카드: CTA 제외, 인트로 제외, 최대 5개
const catCards = slides
  .filter(s => s.category !== 'CTA' && s.category !== '인트로')
  .slice(0, 5)
  .map(s => `<div class="cat"><div class="cat-icon">${s.icon}</div><div class="cat-label">${s.category}</div></div>`)
  .join('');

const html = `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
  background:${theme.bg};
  display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.glow{position:absolute;top:20%;left:50%;transform:translateX(-50%);width:800px;height:800px;
  background:radial-gradient(circle,${theme.glow} 0%,transparent 65%);pointer-events:none;}
.date{font-size:38px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:2px;margin-bottom:28px;text-shadow:0 0 20px ${theme.accent}44;}
.headline{font-size:30px;font-weight:900;color:${theme.accent};margin-bottom:28px;text-align:center;max-width:840px;line-height:1.4;}
.weather-emoji{font-size:120px;margin-bottom:16px;filter:drop-shadow(0 0 20px ${theme.accent}88);}
.weather-temp{font-size:28px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:32px;letter-spacing:1px;}
.title-main{font-size:96px;font-weight:900;color:${theme.accent};line-height:1.1;margin-bottom:4px;text-shadow:0 0 30px ${theme.accent}66;letter-spacing:-1px;}
.title-sub{font-size:96px;font-weight:900;color:#ffffff;line-height:1.1;margin-bottom:24px;letter-spacing:-1px;}
.subtitle{font-size:30px;font-weight:500;color:rgba(255,255,255,0.45);margin-bottom:40px;letter-spacing:1px;}
.line{width:60px;height:3px;background:${theme.line};border-radius:2px;margin-bottom:56px;}
.cats{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;}
.cat{width:160px;background:rgba(255,255,255,0.07);border:1.5px solid ${theme.accent}44;border-radius:16px;padding:24px 0 20px;display:flex;flex-direction:column;align-items:center;gap:12px;}
.cat-icon{font-size:40px;line-height:1;}
.cat-label{font-size:20px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.5px;}
</style></head><body>
<div class="glow"></div>
<div class="date">${config.dateLabel || dateArg}</div>
<div class="headline">${config.thumbnailHeadline || '달라스 한인 뉴스'}</div>
<div class="weather-emoji">${wEmoji}</div>
<div class="weather-temp">${wLabel}</div>
<div class="title-main">달커넥트</div>
<div class="title-sub">아침 브리핑</div>
<div class="subtitle">달라스 한인을 위한 매일 아침 뉴스</div>
<div class="line"></div>
<div class="cats">${catCards}</div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: THUMB_PNG });
  await browser.close();

  // PNG → JPG 변환
  execSync(`ffmpeg -y -i "${THUMB_PNG}" -q:v 2 "${THUMB_JPG}"`, { stdio: 'inherit' });

  const sizePng = (fs.statSync(THUMB_PNG).size / 1024).toFixed(0);
  const sizeJpg = (fs.statSync(THUMB_JPG).size / 1024).toFixed(0);
  console.log(`✅ thumbnail.png (${sizePng}KB) → thumbnail.jpg (${sizeJpg}KB)`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
