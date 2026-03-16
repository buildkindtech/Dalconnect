/**
 * DalKonnect 최신 뉴스 단독 포스트 3개
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'sns-cards', 'news-posts');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function shot(html, filename) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  return out;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}`;

const posts = [
  // ① K-POP 빌보드 차트
  {
    file: 'news-kpop.png',
    bg: '#0a0514',
    bar: 'linear-gradient(to right,#a855f7,#ec4899)',
    glowColor: 'rgba(168,85,247,0.12)',
    badgeBg: 'rgba(168,85,247,0.15)',
    badgeBorder: 'rgba(168,85,247,0.5)',
    badgeColor: '#a855f7',
    badge: '🎵 K-POP · 빌보드',
    source: 'Soompi',
    date: '2026.03.15',
    hook: '이번 주 빌보드를 한국이 휩쓸었다',
    headline: '에이티즈·스트레이키즈·BTS\n빌보드 월드 앨범 차트 상위권 석권',
    desc: '빌보드가 발표한 3월 14일 주간 월드 앨범 차트에서 에이티즈 "GOLDEN HOUR : Part.4"를 필두로 한국 아티스트들이 상위권을 대거 점령했습니다. 엔하이픈, 코르티스, 뉴진스, 아이브, 아일릿까지 — K-POP의 글로벌 영향력이 다시 한번 입증됐습니다.',
    highlightColor: '#a855f7',
    ctaColor: '#a855f7',
  },

  // ② 미국-이란 전쟁 스포츠 여파
  {
    file: 'news-iran-sports.png',
    bg: '#0d0000',
    bar: 'linear-gradient(to right,#ef4444,#f97316)',
    glowColor: 'rgba(239,68,68,0.1)',
    badgeBg: 'rgba(239,68,68,0.15)',
    badgeBorder: 'rgba(239,68,68,0.5)',
    badgeColor: '#ef4444',
    badge: '⚡ 국제 · 긴급',
    source: '조선일보',
    date: '2026.03.15',
    hook: '전쟁이 스포츠까지 덮쳤다',
    headline: 'F1·피날리시마 줄줄이 취소\n항공 유류할증료 4월 급등 예고',
    desc: '미국-이란 전쟁 장기화로 중동 스포츠 이벤트가 연쇄 취소되고 있습니다. F1에 이어 유럽-남미 챔피언십 피날리시마도 무산됐으며, 국제유가 급등으로 4월 항공권에 유류할증료 10만원 이상 추가 인상이 예고됩니다.',
    highlightColor: '#f97316',
    ctaColor: '#ef4444',
  },

  // ③ 트럼프 호르무즈 군함 요청
  {
    file: 'news-hormuz.png',
    bg: '#000d1a',
    bar: 'linear-gradient(to right,#3b82f6,#2ED8A3)',
    glowColor: 'rgba(59,130,246,0.1)',
    badgeBg: 'rgba(59,130,246,0.15)',
    badgeBorder: 'rgba(59,130,246,0.5)',
    badgeColor: '#60a5fa',
    badge: '🌐 국제 · 한국',
    source: '조선일보 · 연합뉴스',
    date: '2026.03.15',
    hook: '트럼프가 한국에 직접 요청했다',
    headline: '호르무즈 해협 군함 파견 요청\n한국 등 5개국 "신중히 검토 중"',
    desc: '트럼프 대통령이 한국·중국·일본·영국·프랑스 5개국에 호르무즈 해협 군함 파견을 공개 요청했습니다. 한국 해군이 대응할 경우 3~4주 소요 예상이며, 청해부대에는 기뢰제거 헬기도 없어 실질적 대응이 어렵다는 분석이 나옵니다.',
    highlightColor: '#2ED8A3',
    ctaColor: '#3b82f6',
  },
];

function makeCard(p) {
  const lines = p.headline.split('\n');
  return `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:${p.bg};font-family:'Noto Sans KR',sans-serif;overflow:hidden;position:relative;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:${p.bar};"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,${p.glowColor},transparent 60%);"></div>

  <div style="height:100%;display:flex;flex-direction:column;padding:56px 64px;position:relative;">

    <!-- 상단: 배지 + 날짜 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:44px;">
      <div style="background:${p.badgeBg};border:1px solid ${p.badgeBorder};padding:10px 24px;border-radius:50px;">
        <span style="color:${p.badgeColor};font-size:20px;font-weight:700;">${p.badge}</span>
      </div>
      <div style="text-align:right;">
        <div style="color:#6b7280;font-size:16px;">${p.source}</div>
        <div style="color:#4b5563;font-size:14px;">${p.date}</div>
      </div>
    </div>

    <!-- 훅 라인 -->
    <div style="color:${p.highlightColor};font-size:26px;font-weight:700;margin-bottom:20px;letter-spacing:-0.3px;">"${p.hook}"</div>

    <!-- 헤드라인 -->
    <h1 style="font-size:58px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:28px;">
      ${lines.map((l,i) => i===0 ? l : `<span style="color:${p.highlightColor};">${l}</span>`).join('<br>')}
    </h1>

    <!-- 구분선 -->
    <div style="width:60px;height:4px;background:${p.highlightColor};border-radius:2px;margin-bottom:28px;"></div>

    <!-- 본문 -->
    <p style="font-size:22px;color:#9ca3af;line-height:1.8;flex:1;">${p.desc}</p>

    <!-- 하단 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;background:${p.highlightColor};border-radius:50%;"></div>
        <span style="color:#fff;font-size:20px;font-weight:800;">DalKonnect</span>
      </div>
      <div style="background:${p.badgeBg};border:1px solid ${p.badgeBorder};padding:10px 22px;border-radius:50px;">
        <span style="color:${p.badgeColor};font-size:17px;font-weight:600;">dalkonnect.com/news →</span>
      </div>
    </div>

  </div>
  </body></html>`;
}

async function main() {
  console.log('뉴스 포스트 생성 중...');
  for (const p of posts) {
    await shot(makeCard(p), p.file);
    console.log('✅', p.file);
  }
  console.log('\n완료!', OUT);
}
main().catch(console.error);
