/**
 * DalKonnect 소개 인트로 카드 4장
 * Canva 스타일 1080x1080 PNG
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'intro');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BRAND = {
  navy: '#0B1F3A',
  teal: '#00B4A6',
  tealLight: '#00D4C8',
  white: '#FFFFFF',
  gray: '#F4F6FA',
  accent: '#FF6B35',
};

const cards = [
  // 카드 1: 달커넥트가 뭐예요?
  {
    name: '01-what-is-dalkonnect',
    html: `
    <div style="width:1080px;height:1080px;background:${BRAND.navy};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;">
      <!-- 배경 원형 장식 -->
      <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(0,180,166,0.2) 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:-150px;left:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,180,166,0.1) 0%,transparent 70%);"></div>
      
      <!-- 태극기+텍사스 이모지 -->
      <div style="font-size:72px;margin-bottom:24px;">🇰🇷🤠</div>
      
      <!-- 로고 타입 -->
      <div style="font-size:80px;font-weight:900;color:${BRAND.white};letter-spacing:-2px;margin-bottom:8px;">DalKonnect</div>
      <div style="font-size:32px;font-weight:400;color:${BRAND.teal};letter-spacing:6px;margin-bottom:48px;">달 커 넥 트</div>
      
      <!-- 구분선 -->
      <div style="width:80px;height:4px;background:${BRAND.teal};border-radius:2px;margin-bottom:48px;"></div>
      
      <!-- 설명 -->
      <div style="font-size:38px;font-weight:700;color:${BRAND.white};text-align:center;line-height:1.5;margin-bottom:16px;">
        달라스-포트워스<br/>한인 커뮤니티 포털
      </div>
      <div style="font-size:26px;font-weight:300;color:rgba(255,255,255,0.6);text-align:center;margin-bottom:56px;">
        DFW 한인의 모든 정보, 한 곳에서
      </div>
      
      <!-- URL 배지 -->
      <div style="background:${BRAND.teal};padding:18px 56px;border-radius:50px;font-size:28px;font-weight:700;color:${BRAND.navy};">
        dalkonnect.com
      </div>
    </div>`
  },

  // 카드 2: 업소록
  {
    name: '02-business-directory',
    html: `
    <div style="width:1080px;height:1080px;background:${BRAND.white};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:60px;">
      <!-- 상단 컬러 바 -->
      <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,${BRAND.navy},${BRAND.teal});"></div>
      
      <!-- 헤더 -->
      <div style="font-size:22px;font-weight:700;color:${BRAND.teal};letter-spacing:4px;margin-bottom:20px;">📍 BUSINESS DIRECTORY</div>
      
      <!-- 숫자 -->
      <div style="font-size:120px;font-weight:900;color:${BRAND.navy};line-height:1;margin-bottom:4px;">1,168</div>
      <div style="font-size:32px;font-weight:600;color:#666;margin-bottom:48px;">개 한인 업소 등록</div>
      
      <!-- 카테고리 그리드 -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:48px;max-width:900px;">
        ${[
          ['🍽️','한식당'],['💇','미용실'],['🏥','병·의원'],['⛪','교회'],
          ['🛒','한인마트'],['🏠','부동산'],['⚖️','법률'],['🦷','치과'],
          ['🥋','태권도'],['💅','네일샵'],['🎓','교육'],['🚗','자동차']
        ].map(([e,t]) => `
          <div style="background:${BRAND.gray};padding:14px 22px;border-radius:40px;font-size:20px;color:${BRAND.navy};display:flex;align-items:center;gap:6px;font-weight:500;">
            <span>${e}</span><span>${t}</span>
          </div>`).join('')}
      </div>
      
      <!-- 하단 -->
      <div style="background:${BRAND.navy};padding:16px 48px;border-radius:50px;font-size:24px;font-weight:700;color:${BRAND.teal};">
        지금 검색하기 → dalkonnect.com
      </div>
    </div>`
  },

  // 카드 3: 뉴스 & 차트
  {
    name: '03-news-charts',
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,#0B1F3A 0%,#0d2b44 60%,#0B1F3A 100%);display:flex;flex-direction:column;font-family:'Noto Sans KR',Arial,sans-serif;color:${BRAND.white};position:relative;overflow:hidden;box-sizing:border-box;padding:70px;">
      <!-- 장식 -->
      <div style="position:absolute;top:0;right:0;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(0,180,166,0.15) 0%,transparent 70%);"></div>

      <!-- 섹션 1: 뉴스 -->
      <div style="margin-bottom:50px;">
        <div style="font-size:18px;letter-spacing:4px;color:${BRAND.teal};font-weight:700;margin-bottom:16px;">📰 DAILY NEWS</div>
        <div style="font-size:48px;font-weight:800;line-height:1.3;margin-bottom:16px;">DFW 로컬 뉴스부터<br/>한국 최신 소식까지</div>
        <div style="font-size:24px;color:rgba(255,255,255,0.6);">매일 3회 업데이트 · 1,000개+ 기사</div>
      </div>

      <!-- 구분선 -->
      <div style="width:100%;height:1px;background:rgba(0,180,166,0.3);margin-bottom:50px;"></div>
      
      <!-- 섹션 2: 차트 -->
      <div style="margin-bottom:50px;">
        <div style="font-size:18px;letter-spacing:4px;color:${BRAND.teal};font-weight:700;margin-bottom:16px;">🎵 K-CULTURE CHARTS</div>
        <div style="font-size:48px;font-weight:800;line-height:1.3;margin-bottom:16px;">음악 · 드라마 · 영화<br/>넷플릭스 · 유튜브</div>
        <div style="font-size:24px;color:rgba(255,255,255,0.6);">매일 최신 랭킹 업데이트</div>
      </div>

      <!-- 하단 -->
      <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:28px;font-weight:900;color:${BRAND.white};">DalKonnect</div>
          <div style="font-size:18px;color:${BRAND.teal};">달라스 한인의 모든 정보</div>
        </div>
        <div style="background:${BRAND.teal};padding:14px 40px;border-radius:50px;font-size:22px;font-weight:700;color:${BRAND.navy};">
          dalkonnect.com
        </div>
      </div>
    </div>`
  },

  // 카드 4: 커뮤니티 & 사고팔기
  {
    name: '04-community',
    html: `
    <div style="width:1080px;height:1080px;background:${BRAND.gray};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;padding:60px;">
      <!-- 상단 컬러 바 -->
      <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,${BRAND.teal},${BRAND.navy});"></div>
      
      <div style="font-size:22px;font-weight:700;color:${BRAND.teal};letter-spacing:4px;margin-bottom:24px;">🤝 COMMUNITY</div>
      <div style="font-size:52px;font-weight:900;color:${BRAND.navy};text-align:center;line-height:1.3;margin-bottom:48px;">
        달라스 한인<br/>커뮤니티 공간
      </div>
      
      <!-- 4개 기능 카드 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:900px;margin-bottom:48px;">
        ${[
          ['💬', '자유 게시판', '달라스 한인들의 이야기'],
          ['🛍️', '사고팔기', '중고 거래 · 나눔 · 구인구직'],
          ['🏷️', '공동구매 딜', 'H-Mart · 한인 업소 특가'],
          ['📍', '업체 등록', '내 가게를 달커넥트에'],
        ].map(([e,t,s]) => `
          <div style="background:${BRAND.white};border-radius:20px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
            <div style="font-size:40px;margin-bottom:12px;">${e}</div>
            <div style="font-size:26px;font-weight:700;color:${BRAND.navy};margin-bottom:6px;">${t}</div>
            <div style="font-size:18px;color:#888;">${s}</div>
          </div>`).join('')}
      </div>
      
      <div style="background:${BRAND.navy};padding:16px 48px;border-radius:50px;font-size:24px;font-weight:700;color:${BRAND.teal};">
        dalkonnect.com
      </div>
    </div>`
  },
];

async function generate() {
  console.log('🚀 인트로 카드 4장 생성 중...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  for (const card of cards) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(`
      <html><head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>*{margin:0;padding:0;box-sizing:border-box;}</style>
      </head><body>${card.html}</body></html>
    `, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const outPath = path.join(OUTPUT_DIR, `${card.name}.png`);
    await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    console.log(`  ✅ ${card.name}.png`);
    await page.close();
  }
  
  await browser.close();
  console.log(`\n✅ 완료! ${OUTPUT_DIR}`);
}

generate().catch(console.error);
