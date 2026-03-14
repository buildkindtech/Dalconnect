/**
 * Instagram 그리드 레이아웃 프리뷰
 * 최신글이 왼쪽위부터 채워짐 → 올리는 순서를 역순으로 계획
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'sns-cards', 'grid-preview.png');
const BRAND_DIR = path.join(__dirname, '..', 'sns-cards', 'brand');

// 그리드 배치 계획 (Row1 왼→오가 가장 최신)
// 포스팅 순서는 아래에서 위로, 오른→왼 순으로!
const GRID = [
  // Row 1 (최신, 상단) — 3개: 소개/아이덴티티
  { name: 'D-welcome',          label: '①D\n웰컴',       accent: '#00B4A6' },
  { name: '01-intro',           label: '②01\n소개',      accent: '#00B4A6' },
  { name: 'B-why-we-built',     label: '③B\n스토리',     accent: '#00B4A6' },
  // Row 2 (중간) — 3개: 핵심 기능
  { name: '02-directory',       label: '④02\n업소록',    accent: '#00B4A6' },
  { name: '03-news-charts',     label: '⑤03\n뉴스+차트', accent: '#C41E3A' },
  { name: '04-community',       label: '⑥04\n커뮤니티',  accent: '#059669' },
  // Row 3 (하단) — 3개: 유틸/비즈니스
  { name: 'C-register-business',label: '⑦C\n업소등록',   accent: '#C9A84C' },
  { name: 'E-google-map',       label: '⑧E\n구글맵',     accent: '#00B4A6' },
  { name: 'A-how-to-use',       label: '⑨A\n사용법',     accent: '#00B4A6' },
];

// 포스팅 순서 = 역순 (⑨→①)
const POST_ORDER = [...GRID].reverse();

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1200, deviceScaleFactor: 2 });

  // 각 카드 썸네일을 base64로 로드
  const images = {};
  for (const item of GRID) {
    const imgPath = path.join(BRAND_DIR, `${item.name}.png`);
    if (fs.existsSync(imgPath)) {
      const data = fs.readFileSync(imgPath).toString('base64');
      images[item.name] = `data:image/png;base64,${data}`;
    }
  }

  const html = `<html><head>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{width:1080px;height:1200px;background:#0B1F3A;font-family:'Noto Sans KR',sans-serif;overflow:hidden;}</style>
  </head><body>
  <div style="padding:32px;">
    <!-- 제목 -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:16px;letter-spacing:4px;color:#00B4A6;font-weight:700;margin-bottom:6px;">INSTAGRAM GRID PLAN</div>
      <div style="font-size:28px;font-weight:900;color:#fff;">포스팅 순서 계획</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.4);margin-top:6px;">최신글이 왼쪽 위부터 → 올리는 순서: ⑨→①</div>
    </div>

    <!-- 그리드 -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:20px;">
      ${GRID.map((item, i) => `
        <div style="position:relative;aspect-ratio:1;overflow:hidden;border-radius:4px;">
          <img src="${images[item.name] || ''}" style="width:100%;height:100%;object-fit:cover;"/>
          <!-- 번호 뱃지 -->
          <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.75);border:1.5px solid ${item.accent};padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;color:${item.accent};">${['①','②','③','④','⑤','⑥','⑦','⑧','⑨'][i]}</div>
        </div>`).join('')}
    </div>

    <!-- 포스팅 순서 -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px 24px;">
      <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:14px;letter-spacing:2px;">POSTING ORDER (이 순서로 올리면 위 그리드 완성)</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${POST_ORDER.map((item, i) => `
          <div style="background:rgba(255,255,255,0.07);border:1px solid ${item.accent}50;padding:8px 16px;border-radius:50px;font-size:13px;color:#fff;">
            <span style="color:${item.accent};font-weight:700;">${9-i}번째</span> ${item.label.replace('\n',' ')}
          </div>`).join('')}
      </div>
    </div>
  </div>
  </body></html>`;

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: OUTPUT, type: 'png', clip: { x:0,y:0,width:1080,height:1200 } });
  await browser.close();

  // 포스팅 순서 출력
  console.log('\n📋 포스팅 순서 (이 순서대로 올려야 그리드 완성):');
  POST_ORDER.forEach((item, i) => console.log(`  ${i+1}번째: ${item.name}`));
  console.log('\n✅ grid-preview.png 생성 완료');
})();
