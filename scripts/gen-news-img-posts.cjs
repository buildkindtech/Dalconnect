/**
 * DalKonnect 뉴스 포스트 — 실제 썸네일 이미지 배경 사용
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'sns-cards', 'news-img-posts');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function shot(html, filename) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  return out;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">`;

const posts = [
  {
    file: 'kpop-chart.png',
    imgUrl: 'https://0.soompi.io/wp-content/uploads/2026/03/15110146/ATEEZ-ENHYPEN-Stray-Kids-BTS.jpg',
    badgeColor: '#a855f7',
    badge: '🎵 K-POP',
    source: 'Soompi · 2026.03.15',
    headline: '에이티즈·스트레이키즈·BTS\n빌보드 월드 앨범 차트 석권',
    sub: '이번 주 빌보드를 한국이 휩쓸었다',
    overlayColor: 'rgba(10,5,20,0.72)',
    accentColor: '#a855f7',
  },
  {
    file: 'iran-sports.png',
    imgUrl: 'https://img.khan.co.kr/news/2026/03/15/news-p.v1.20260315.354ff637cc0743d7b2a991777a5e515a_P1.png',
    badgeColor: '#ef4444',
    badge: '⚡ 국제',
    source: '조선일보 · 2026.03.15',
    headline: 'F1·피날리시마 줄줄이 취소\n항공 유류할증료 4월 급등 예고',
    sub: '미이란 전쟁이 일상까지 덮쳤다',
    overlayColor: 'rgba(13,0,0,0.73)',
    accentColor: '#ef4444',
  },
  {
    file: 'hormuz.png',
    imgUrl: 'https://img.yna.co.kr/etc/inner/KR/2026/03/16/AKR20260316001700071_01_i_P2.jpg',
    badgeColor: '#2ED8A3',
    badge: '🌐 한국',
    source: '연합뉴스 · 2026.03.15',
    headline: '트럼프, 한국 등 5개국에\n호르무즈 군함 파견 요청',
    sub: '한국 정부 "신중히 검토 중"',
    overlayColor: 'rgba(0,13,26,0.72)',
    accentColor: '#2ED8A3',
  },
];

function makeCard(p) {
  const lines = p.headline.split('\n');
  return `<html><head>${FONTS}
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:1080px; height:1080px; overflow:hidden; font-family:'Noto Sans KR',sans-serif; position:relative; }
    .bg {
      position:absolute; inset:0;
      background-image: url('${p.imgUrl}');
      background-size: cover;
      background-position: center;
    }
    .overlay {
      position:absolute; inset:0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.25) 0%,
        ${p.overlayColor} 45%,
        rgba(0,0,0,0.92) 100%
      );
    }
    .content {
      position:relative; height:100%;
      display:flex; flex-direction:column;
      padding:52px 60px;
    }
  </style>
  </head>
  <body>
    <div class="bg"></div>
    <div class="overlay"></div>
    <div class="content">

      <!-- 상단 배지 -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="background:${p.badgeColor};padding:10px 24px;border-radius:50px;">
          <span style="color:#fff;font-size:20px;font-weight:700;">${p.badge}</span>
        </div>
        <div style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);padding:10px 20px;border-radius:50px;border:1px solid rgba(255,255,255,0.15);">
          <span style="color:rgba(255,255,255,0.8);font-size:16px;">${p.source}</span>
        </div>
      </div>

      <!-- 공백 — 이미지 보이게 -->
      <div style="flex:1;"></div>

      <!-- 서브 훅 -->
      <div style="color:${p.accentColor};font-size:24px;font-weight:700;margin-bottom:14px;">"${p.sub}"</div>

      <!-- 메인 헤드라인 -->
      <h1 style="font-size:60px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:28px;text-shadow:0 2px 12px rgba(0,0,0,0.8);">
        ${lines.map((l,i) => i===1 ? `<span style="color:${p.accentColor};">${l}</span>` : l).join('<br>')}
      </h1>

      <!-- 구분선 -->
      <div style="width:56px;height:4px;background:${p.accentColor};border-radius:2px;margin-bottom:28px;"></div>

      <!-- 하단 로고 + CTA -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:9px;height:9px;background:#2ED8A3;border-radius:50%;"></div>
          <span style="color:#fff;font-size:22px;font-weight:800;">DalKonnect</span>
        </div>
        <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);padding:12px 24px;border-radius:50px;">
          <span style="color:#fff;font-size:17px;font-weight:600;">dalkonnect.com/news →</span>
        </div>
      </div>

    </div>
  </body></html>`;
}

async function main() {
  console.log('이미지 뉴스 포스트 생성 중...');
  for (const p of posts) {
    await shot(makeCard(p), p.file);
    console.log('✅', p.file);
  }
  console.log('완료!', OUT);
}
main().catch(console.error);
