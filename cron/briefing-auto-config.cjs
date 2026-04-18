#!/usr/bin/env node
/**
 * 아침 브리핑 — Whisper 전사 결과로 briefing-config.json 자동 생성
 *
 * 사용법:
 *   node briefing-auto-config.cjs YYYY-MM-DD
 *
 * 입력:
 *   memory/morning-reels/YYYY-MM-DD/voice_1.20x.json  (Whisper 결과)
 *
 * 출력:
 *   memory/morning-reels/YYYY-MM-DD/briefing-config.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { askAI } = require('./ai.cjs');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node briefing-auto-config.cjs YYYY-MM-DD');
  process.exit(1);
}

const DATE_DIR = path.join(BASE, 'memory', 'morning-reels', dateArg);
const WHISPER_JSON = path.join(DATE_DIR, 'voice_1.20x.json');
const CONFIG_PATH = path.join(DATE_DIR, 'briefing-config.json');

if (!fs.existsSync(WHISPER_JSON)) {
  console.error(`❌ Whisper JSON 없음: ${WHISPER_JSON}`);
  process.exit(1);
}

// ─── 날짜 ───────────────────────────────────────────────
function getDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

// ─── 날씨 ───────────────────────────────────────────────
function fetchWeather() {
  return new Promise((resolve) => {
    https.get('https://wttr.in/Dallas,TX?format=j1', (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          const w = JSON.parse(buf);
          const today = w.weather[0];
          const minF = parseInt(today.mintempF);
          const maxF = parseInt(today.maxtempF);
          const minC = Math.round((minF - 32) * 5/9);
          const maxC = Math.round((maxF - 32) * 5/9);
          const desc = today.hourly[4]?.weatherDesc[0]?.value || '맑음';
          resolve({ minF, maxF, minC, maxC, desc });
        } catch (_) {
          resolve({ minF: null, maxF: null, minC: null, maxC: null, desc: '맑음' });
        }
      });
    }).on('error', () => resolve({ minF: null, maxF: null, minC: null, maxC: null, desc: '맑음' }));
  });
}

// ─── 전사 텍스트 추출 ─────────────────────────────────────
function extractTranscript(whisperJson) {
  const data = JSON.parse(fs.readFileSync(whisperJson, 'utf8'));
  if (data.text) return data.text.trim();
  return (data.segments || []).map(s => s.text).join(' ').trim();
}

// ─── 슬라이드 색상 팔레트 ────────────────────────────────
const CATEGORY_STYLES = {
  '달라스': { icon: '🏙️', accent: '#60a5fa', bg: 'linear-gradient(160deg,#0f1a2e 0%,#1e3a5f 50%,#0f1a2e 100%)' },
  '한국':   { icon: '🇰🇷', accent: '#f87171', bg: 'linear-gradient(160deg,#1a0a0a 0%,#3b1010 50%,#1a0a0a 100%)' },
  '경제':   { icon: '📈', accent: '#fbbf24', bg: 'linear-gradient(160deg,#1a1400 0%,#3b3000 50%,#1a1400 100%)' },
  '건강':   { icon: '💊', accent: '#2dd4bf', bg: 'linear-gradient(160deg,#001a18 0%,#003b36 50%,#001a18 100%)' },
  '문화':   { icon: '🎬', accent: '#c084fc', bg: 'linear-gradient(160deg,#1a0a2e 0%,#3b1060 50%,#1a0a2e 100%)' },
  '생활':   { icon: '💡', accent: '#f97316', bg: 'linear-gradient(160deg,#1a0800 0%,#3b1800 50%,#1a0800 100%)' },
  '기술':   { icon: '💻', accent: '#38bdf8', bg: 'linear-gradient(160deg,#0a1520 0%,#0f3050 50%,#0a1520 100%)' },
  '사회':   { icon: '🗞️', accent: '#a3e635', bg: 'linear-gradient(160deg,#0a1400 0%,#1a3000 50%,#0a1400 100%)' },
  '스포츠': { icon: '⚽', accent: '#fb923c', bg: 'linear-gradient(160deg,#1a0e00 0%,#3b2000 50%,#1a0e00 100%)' },
  '기타':   { icon: '📌', accent: '#94a3b8', bg: 'linear-gradient(160deg,#0a0c14 0%,#1a2030 50%,#0a0c14 100%)' },
};

function getStyle(category) {
  for (const [key, style] of Object.entries(CATEGORY_STYLES)) {
    if (category.includes(key)) return style;
  }
  return CATEGORY_STYLES['기타'];
}

// ─── 메인 ───────────────────────────────────────────────
(async () => {
  console.log(`[briefing-auto-config] ${dateArg} 처리 시작`);

  const transcript = extractTranscript(WHISPER_JSON);
  console.log(`전사 길이: ${transcript.length}자`);

  const weather = await fetchWeather();
  console.log(`날씨: ${weather.desc} / 최저 ${weather.minC}°C 최고 ${weather.maxC}°C`);

  // Claude로 뉴스 항목 파싱
  const parsePrompt = `아래는 한국어 뉴스 브리핑 전사 텍스트입니다.
각 뉴스 항목을 JSON 배열로 추출해주세요.

전사 텍스트:
${transcript}

다음 JSON 형식으로 뉴스 항목만 추출 (인트로/날씨/마무리 제외):
[
  { "category": "카테고리명(달라스/한국/경제/건강/문화/생활/기술/사회/스포츠 중 가장 적합한 것)", "subtitle": "15자 이내 핵심 요약" },
  ...
]

JSON 배열만 출력하세요. 다른 텍스트 없이.`;

  let newsItems = [];
  try {
    const raw = await askAI(parsePrompt, { maxTokens: 1000 });
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      newsItems = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('뉴스 파싱 오류:', e.message);
    process.exit(1);
  }
  // ── 퍼포먼스 인사이트 기반 뉴스 수 조정 ─────────────────
  let maxNews = 8;
  const insightsFile = path.join(BASE, 'data', 'briefing-insights.json');
  if (fs.existsSync(insightsFile)) {
    try {
      const insights = JSON.parse(fs.readFileSync(insightsFile, 'utf8'));
      if (insights.targetSec && insights.sampleCount >= 3) {
        // 인트로(~15s) + 아웃트로(~10s) 제외 후 뉴스당 ~18s 기준
        const computed = Math.round((insights.targetSec - 25) / 18);
        maxNews = Math.min(8, Math.max(5, computed));
        console.log(`📊 인사이트 적용: targetSec=${insights.targetSec}s → 최대 뉴스 ${maxNews}개 (샘플 ${insights.sampleCount}개)`);
      }
    } catch (_) {}
  }
  newsItems = newsItems.slice(0, maxNews);
  console.log(`뉴스 항목 ${newsItems.length}개 파싱 완료`);

  // 썸네일 헤드라인
  const headlinePrompt = `아래 뉴스 목록에서 가장 임팩트 있는 것 하나를 20자 이내로 요약:
${newsItems.map((n,i) => `${i+1}. [${n.category}] ${n.subtitle}`).join('\n')}
텍스트만 출력:`;
  const thumbnailHeadline = (await askAI(headlinePrompt, { maxTokens: 80 })).trim().replace(/^["']|["']$/g, '');

  // IG 캡션 — 4/8 스타일 고정 (불렛 형식, 짧고 임팩트 있게)
  const newsLines = newsItems.slice(0, 5).map(n => `• ${n.subtitle}`).join('\n');
  const captionPrompt = `달커넥트 아침 브리핑 IG 캡션. 아래 형식 그대로 작성. 절대 단락 서술 금지.

형식 예시:
☀️ 달커넥트 아침 브리핑 | [월 일]

오늘 꼭 알아야 할 달라스 & 한국 소식 ⬇️

[이모지] [뉴스 제목 한 줄]
[이모지] [뉴스 제목 한 줄]
[이모지] [뉴스 제목 한 줄]
[이모지] [뉴스 제목 한 줄]
[이모지] [뉴스 제목 한 줄]

매일 아침 달라스 한인 뉴스 👉 dalkonnect.com
팔로우하고 매일 받아보세요!

#달커넥트 #달라스한인 #DFW한인 #아침브리핑 #한인뉴스 #달라스뉴스 #DalKonnect

---
오늘 날짜: ${dateArg}
뉴스 목록:
${newsLines}

위 형식 그대로, 뉴스 5개 각각 한 줄씩. 총 300자 이내.`;
  let caption = (await askAI(captionPrompt, { maxTokens: 350 })).trim();
  // 2200자 제한 안전장치
  if (caption.length > 2000) caption = caption.slice(0, 1980) + '\n#달커넥트';

  // 슬라이드 구조 생성
  const dateLabel = getDateLabel(dateArg);
  const slides = [
    {
      id: 0, category: '인트로', icon: '📰',
      title: dateLabel, subtitle: '달커넥트 아침 브리핑',
      accent: '#60a5fa',
      bg: 'linear-gradient(160deg,#0a0c14 0%,#1a2540 50%,#0a0c14 100%)',
      badge: '달커넥트 아침브리핑'
    },
    ...newsItems.map((item, i) => {
      const style = getStyle(item.category);
      return {
        id: i + 1,
        category: item.category,
        icon: style.icon,
        title: item.category,
        subtitle: item.subtitle,
        accent: style.accent,
        bg: style.bg,
        badge: `${style.icon} ${item.category}`
      };
    }),
    {
      id: newsItems.length + 1, category: 'CTA', icon: '👇',
      title: '달커넥트', subtitle: 'dalkonnect.com',
      accent: '#60a5fa',
      bg: 'linear-gradient(160deg,#0a0c14 0%,#1a2540 50%,#0a0c14 100%)',
      badge: '달커넥트'
    }
  ];

  const config = {
    date: dateArg,
    dateLabel,
    weather,
    slides,
    caption,
    thumbnailHeadline,
    newsItems: newsItems.map((n, i) => ({ index: i+1, category: n.category, subtitle: n.subtitle })),
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ briefing-config.json 자동 생성 완료: ${CONFIG_PATH}`);
  console.log(`   슬라이드 ${slides.length}개 (뉴스 ${newsItems.length}개 + 인트로 + CTA)`);
})();
