/**
 * Sunday 포스팅 카드 3개 생성
 * 1. 교회 찾기 (팁리스트)
 * 2. 뉴스 하이라이트
 * 3. K-차트
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'sunday');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function genCard(html, filename) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox','--font-render-hinting=none'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));
  const out = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('✅', filename);
  return out;
}

const BRAND = `<div style="display:flex;align-items:center;gap:8px;">
  <div style="width:10px;height:10px;background:#2ED8A3;border-radius:50%;"></div>
  <span style="font-family:'Noto Sans KR',sans-serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px;">DalKonnect</span>
</div>`;

// ─── CARD 1: 교회 찾기 ───────────────────────────────────────────────
const card1 = `<html><head>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">

<!-- 배경 텍스처 -->
<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 20% 30%, rgba(46,216,163,0.06) 0%, transparent 60%),radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.05) 0%, transparent 60%);"></div>

<!-- 상단 바 -->
<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>

<div style="position:relative;padding:52px 60px;height:100%;display:flex;flex-direction:column;">

  <!-- 헤더 -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:44px;">
    <div style="background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.4);padding:10px 22px;border-radius:40px;">
      <span style="color:#2ED8A3;font-size:24px;font-weight:700;letter-spacing:2px;">SUNDAY SPECIAL</span>
    </div>
    ${BRAND}
  </div>

  <!-- 메인 헤드라인 -->
  <div style="margin-bottom:14px;">
    <span style="font-size:26px;color:#9ca3af;font-weight:500;letter-spacing:3px;">DALLAS KOREAN CHURCH GUIDE</span>
  </div>
  <h1 style="font-size:88px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:10px;">
    DFW 한인교회<br><span style="color:#2ED8A3;">찾기 가이드</span>
  </h1>
  <p style="color:#9ca3af;font-size:28px;margin-bottom:40px;">100개 이상의 한인교회 지역별 정리</p>

  <!-- 교회 목록 -->
  <div style="flex:1;display:flex;flex-direction:column;gap:14px;">
    ${[
      ['🏛', '달라스 중심부', 'WOORI REFORMED · Semihan Church · 세상의빛교회'],
      ['🏙', '플라노/프리스코', '라이트하우스 달라스 · Joyful Korean · 새생명비전교회'],
      ['🌆', '캐럴턴/루이스빌', '코너스톤 침례교회 · 리스타트 교회 · IN2 Dallas'],
      ['🏘', '포트워스/어빙', '세계로제자교회 · Korean Adventist Church'],
    ].map(([emoji, area, churches]) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:22px 28px;display:flex;align-items:center;gap:22px;">
      <span style="font-size:38px;">${emoji}</span>
      <div>
        <div style="color:#2ED8A3;font-size:24px;font-weight:700;margin-bottom:6px;">${area}</div>
        <div style="color:#d1d5db;font-size:20px;">${churches}</div>
      </div>
    </div>`).join('')}
  </div>

  <!-- 하단 CTA -->
  <div style="margin-top:28px;display:flex;align-items:center;justify-content:space-between;">
    <div style="background:#2ED8A3;padding:18px 36px;border-radius:40px;">
      <span style="color:#0B1220;font-size:22px;font-weight:800;">전체 가이드 → dalkonnect.com/blog</span>
    </div>
    <span style="color:#6b7280;font-size:22px;">⛪ 오늘은 주일!</span>
  </div>
</div>
</body></html>`;

// ─── CARD 2: 뉴스 하이라이트 ─────────────────────────────────────────
const card2 = `<html><head>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:1080px;height:1080px;background:#0d0d0d;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">

<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(to right,#ef4444,#f97316);"></div>

<div style="position:relative;padding:52px 60px;height:100%;display:flex;flex-direction:column;">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;">
    <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);padding:10px 22px;border-radius:40px;">
      <span style="color:#ef4444;font-size:24px;font-weight:700;letter-spacing:2px;">THIS WEEK</span>
    </div>
    ${BRAND}
  </div>

  <div style="margin-bottom:10px;">
    <span style="font-size:26px;color:#6b7280;font-weight:500;letter-spacing:3px;">WEEKLY NEWS HIGHLIGHTS</span>
  </div>
  <h1 style="font-size:84px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:36px;">
    이번 주<br><span style="color:#f97316;">주요 뉴스</span>
  </h1>

  <div style="flex:1;display:flex;flex-direction:column;gap:16px;">
    ${[
      ['🌐', '국제', '북한 공작원들, AI로 유럽 대기업 위장취업해 임금 챙겨', '#7B2FFF'],
      ['🇺🇸', '미국', '트럼프, 이란전 보도에 격분…미당국 방송사 압박 협박', '#C41E3A'],
      ['⚡', '세계', '이란, 걸프 국가들에 미사일 위협 직면', '#f97316'],
      ['💪', 'DFW', '달라스 십대 암 생존자, 메이크어위시로 지역사회 봉사', '#2ED8A3'],
    ].map(([emoji, cat, title, color]) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px 28px;display:flex;align-items:flex-start;gap:20px;">
      <span style="font-size:36px;margin-top:2px;">${emoji}</span>
      <div style="flex:1;">
        <span style="color:${color};font-size:20px;font-weight:700;letter-spacing:1px;">${cat}</span>
        <div style="color:#e5e7eb;font-size:24px;font-weight:700;line-height:1.4;margin-top:4px;">${title}</div>
      </div>
    </div>`).join('')}
  </div>

  <div style="margin-top:24px;display:flex;align-items:center;justify-content:space-between;">
    <div style="background:rgba(249,115,22,0.2);border:1px solid rgba(249,115,22,0.4);padding:16px 30px;border-radius:40px;">
      <span style="color:#f97316;font-size:22px;font-weight:700;">더 많은 뉴스 → dalkonnect.com/news</span>
    </div>
    <span style="color:#6b7280;font-size:20px;">📰 매일 업데이트</span>
  </div>
</div>
</body></html>`;

// ─── CARD 3: K-차트 ───────────────────────────────────────────────────
const card3 = `<html><head>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}</style>
</head><body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">

<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:300px;background:radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.1), transparent);"></div>

<div style="position:relative;padding:52px 60px;height:100%;display:flex;flex-direction:column;">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;">
    <div style="background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);padding:10px 22px;border-radius:40px;">
      <span style="color:#a855f7;font-size:24px;font-weight:700;letter-spacing:2px;">WEEKLY CHART</span>
    </div>
    ${BRAND}
  </div>

  <div style="margin-bottom:10px;">
    <span style="font-size:26px;color:#6b7280;letter-spacing:3px;">K-CONTENT TOP CHART</span>
  </div>
  <h1 style="font-size:82px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:32px;">
    이번 주<br><span style="color:#a855f7;">K-컨텐츠</span> 차트
  </h1>

  <div style="flex:1;display:flex;gap:24px;">
    <!-- 드라마 -->
    <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px;">
      <div style="color:#ec4899;font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:18px;">🎬 드라마</div>
      ${[['1','Boyfriend on Demand'],['2','The Price of Goodbye'],['3','Pursuit of Jade']].map(([n,t])=>`
      <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:28px;font-weight:900;color:${n==='1'?'#ec4899':'#6b7280'};min-width:32px;">${n}</span>
        <span style="color:#e5e7eb;font-size:22px;font-weight:${n==='1'?'700':'500'};line-height:1.3;">${t}</span>
      </div>`).join('')}
    </div>
    <!-- 뮤직+영화 -->
    <div style="flex:1;display:flex;flex-direction:column;gap:16px;">
      <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
        <div style="color:#a855f7;font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:14px;">🎵 뮤직</div>
        ${[['1','BANG BANG','404 (New Era)'],['2','RUDE!','0+0'],['3','GO BLACKPINK','BLACKPINK']].map(([n,t,a])=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:22px;font-weight:900;color:${n==='1'?'#a855f7':'#6b7280'};min-width:26px;">${n}</span>
          <div><div style="color:#e5e7eb;font-size:20px;font-weight:${n==='1'?'700':'400'};">${t}</div><div style="color:#9ca3af;font-size:17px;">${a}</div></div>
        </div>`).join('')}
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
        <div style="color:#2ED8A3;font-size:20px;font-weight:700;letter-spacing:2px;margin-bottom:14px;">🎬 영화</div>
        ${[['1','왕과 사는 남자','55만명 돌파'],['2','War Machine','Netflix'],['3','K-foodie meets J-foodie','Netflix']].map(([n,t,a])=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:22px;font-weight:900;color:${n==='1'?'#2ED8A3':'#6b7280'};min-width:26px;">${n}</span>
          <div><div style="color:#e5e7eb;font-size:20px;font-weight:${n==='1'?'700':'400'};">${t}</div><div style="color:#9ca3af;font-size:17px;">${a}</div></div>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <div style="margin-top:24px;display:flex;align-items:center;justify-content:space-between;">
    <div style="background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.4);padding:16px 30px;border-radius:40px;">
      <span style="color:#a855f7;font-size:22px;font-weight:700;">전체 차트 → dalkonnect.com/charts</span>
    </div>
    <span style="color:#6b7280;font-size:20px;">📅 2026.03.15</span>
  </div>
</div>
</body></html>`;

async function main() {
  console.log('카드 생성 중...');
  const paths = [];
  paths.push(await genCard(card1, 'sunday-church.png'));
  paths.push(await genCard(card2, 'sunday-news.png'));
  paths.push(await genCard(card3, 'sunday-chart.png'));
  console.log('\n✅ 완료! 파일:', paths);
}

main().catch(console.error);
