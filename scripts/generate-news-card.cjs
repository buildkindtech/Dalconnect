/**
 * DalKonnect 뉴스 카드 생성기
 * 뉴스 이미지 + 제목 + 브랜드 오버레이 → 1080x1080 PNG
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'news-cards');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * @param {object} opts
 * @param {string} opts.title - 뉴스 제목
 * @param {string} opts.imageUrl - 뉴스 이미지 URL
 * @param {string} opts.category - 'DFW 뉴스' | '한국 뉴스' | 'K-차트' 등
 * @param {string} opts.categoryColor - 카테고리 컬러 hex
 * @param {string} opts.outputName - 저장 파일명 (확장자 없이)
 * @returns {string} 저장된 파일 경로
 */
async function generateNewsCard({ title, imageUrl, category = 'DFW 뉴스', categoryColor = '#C41E3A', source = '', outputName = 'news-card' }) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  // 제목에서 핵심 키워드 추출 (첫 번째 명사구 강조)
  const highlightTitle = (t) => {
    // 숫자+단위 패턴 강조 (예: 80명, 100억, 3인조)
    return t.replace(/(\d+[가-힣a-zA-Z]*)/g, '<span style="color:#00E5D4;">$1</span>');
  };

  const html = `<html><head>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800;900&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Noto Sans KR', sans-serif; background:#000; }
    </style>
  </head><body>
  <div style="width:1080px;height:1080px;position:relative;overflow:hidden;">
    
    <!-- 배경 이미지 -->
    <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;opacity:0.45;" onerror="this.style.display='none'"/>
    
    <!-- 상단 그라디언트 -->
    <div style="position:absolute;top:0;left:0;right:0;height:220px;background:linear-gradient(to bottom,rgba(0,0,0,0.75),transparent);"></div>
    <!-- 하단 그라디언트 -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:260px;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);"></div>
    
    <!-- 상단: 카테고리 + 브랜드 -->
    <div style="position:absolute;top:0;left:0;right:0;padding:38px 44px;display:flex;align-items:center;justify-content:space-between;">
      <div style="background:${categoryColor};padding:11px 26px;border-radius:50px;font-size:19px;font-weight:700;color:white;letter-spacing:0.5px;">${category}</div>
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:9px;height:9px;border-radius:50%;background:#00B4A6;box-shadow:0 0 8px #00B4A6;"></div>
        <span style="font-size:21px;font-weight:800;color:white;letter-spacing:1.5px;">DalKonnect</span>
      </div>
    </div>
    
    <!-- 정중앙 텍스트 -->
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:940px;text-align:center;">
      <!-- 상단 글로우 라인 -->
      <div style="width:60px;height:4px;background:#00B4A6;border-radius:4px;margin:0 auto 28px;box-shadow:0 0 16px #00B4A6;"></div>
      
      <!-- 제목 -->
      <div style="font-size:${title.length > 28 ? '50px' : '58px'};font-weight:900;color:white;line-height:1.4;word-break:keep-all;
        text-shadow:0 0 40px rgba(0,0,0,0.9),0 4px 16px rgba(0,0,0,0.7),0 2px 4px rgba(0,0,0,1);letter-spacing:-0.5px;">
        ${highlightTitle(title)}
      </div>
      
      <!-- 하단 글로우 라인 -->
      <div style="width:60px;height:4px;background:#00B4A6;border-radius:4px;margin:28px auto 0;box-shadow:0 0 16px #00B4A6;"></div>
    </div>
    
    <!-- 하단: 출처 + CTA -->
    <div style="position:absolute;bottom:0;left:0;right:0;padding:34px 44px;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:16px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;">${source || '달커넥트 뉴스'}</div>
      <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);backdrop-filter:blur(12px);padding:11px 30px;border-radius:50px;font-size:16px;font-weight:700;color:white;letter-spacing:0.5px;">dalkonnect.com →</div>
    </div>
    
  </div>
  </body></html>`;

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
  const outPath = path.join(OUTPUT_DIR, `${outputName}.png`);
  await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  await browser.close();
  return outPath;
}

module.exports = { generateNewsCard };

// 단독 실행 테스트
if (require.main === module) {
  generateNewsCard({
    title: '최신 포브스 억만장자 명단에 텍사스 주민 80명 포함',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080',
    category: 'DFW 뉴스',
    categoryColor: '#C41E3A',
    outputName: 'test-news',
  }).then(p => console.log('✅ 생성:', p)).catch(console.error);
}
