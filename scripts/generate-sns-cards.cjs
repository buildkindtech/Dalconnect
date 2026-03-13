/**
 * DalKonnect SNS 카드 자동 생성
 * Puppeteer로 HTML → PNG 변환
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const CARDS = [
  // 1. 런칭 배너
  {
    name: 'launch-banner',
    width: 1080,
    height: 1080,
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:60px;box-sizing:border-box;">
      <div style="font-size:28px;letter-spacing:8px;color:#e94560;margin-bottom:20px;">🎉 NEW OPEN</div>
      <div style="font-size:72px;font-weight:800;margin-bottom:10px;">달커넥트</div>
      <div style="font-size:32px;font-weight:300;color:#a8b8d8;margin-bottom:50px;">DalKonnect</div>
      <div style="width:120px;height:3px;background:#e94560;margin-bottom:50px;"></div>
      <div style="font-size:36px;font-weight:600;margin-bottom:15px;">DFW 한인 업소록 1,168개</div>
      <div style="font-size:36px;font-weight:600;margin-bottom:15px;">한글 뉴스 · 맛집 · 커뮤니티</div>
      <div style="font-size:36px;font-weight:600;margin-bottom:50px;">사고팔기 · 딜 · 차트</div>
      <div style="background:#e94560;padding:18px 50px;border-radius:50px;font-size:28px;font-weight:700;">dalkonnect.com</div>
      <div style="font-size:20px;color:#5a6a8a;margin-top:30px;">달라스 한인의 모든 것, 한곳에서</div>
    </div>`
  },
  // 2. 업소록 소개
  {
    name: 'directory-intro',
    width: 1080,
    height: 1080,
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(180deg,#fff5f5 0%,#fff 50%,#f8f9ff 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;padding:60px;box-sizing:border-box;">
      <div style="font-size:24px;color:#e94560;font-weight:700;letter-spacing:3px;margin-bottom:30px;">📍 DFW 한인 업소록</div>
      <div style="font-size:56px;font-weight:800;color:#1a1a2e;margin-bottom:40px;text-align:center;line-height:1.3;">달라스에서<br/>한인 업소 찾을 땐</div>
      <div style="display:flex;flex-wrap:wrap;gap:15px;justify-content:center;margin-bottom:40px;">
        ${['🍽️ 한식당', '💇 미용실', '🏥 병원', '⛪ 교회', '🛒 마트', '🏠 부동산', '⚖️ 법률', '🦷 치과', '🥋 태권도', '💅 네일'].map(c => 
          `<div style="background:white;padding:12px 24px;border-radius:25px;font-size:22px;box-shadow:0 2px 10px rgba(0,0,0,0.08);color:#333;">${c}</div>`
        ).join('')}
      </div>
      <div style="font-size:80px;font-weight:900;color:#e94560;margin-bottom:10px;">1,168</div>
      <div style="font-size:28px;color:#666;">개 업소 등록 완료</div>
      <div style="margin-top:40px;background:#1a1a2e;padding:16px 45px;border-radius:50px;font-size:24px;font-weight:600;color:white;">dalkonnect.com →</div>
    </div>`
  },
  // 3. 이사 왔어요 카드
  {
    name: 'newcomer-guide',
    width: 1080,
    height: 1080,
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:60px;box-sizing:border-box;">
      <div style="font-size:60px;margin-bottom:20px;">🏡</div>
      <div style="font-size:52px;font-weight:800;margin-bottom:15px;text-align:center;line-height:1.3;">달라스 이사 왔어요?</div>
      <div style="font-size:28px;font-weight:300;opacity:0.8;margin-bottom:50px;">여기서 다 찾으세요!</div>
      <div style="display:flex;flex-direction:column;gap:18px;width:100%;max-width:700px;">
        ${[
          ['🔍', '한인 업소 1,168개 검색'],
          ['📰', '매일 업데이트 DFW 한인 뉴스'],
          ['💬', '커뮤니티 질문/답변'],
          ['🛍️', '사고팔기 마켓'],
          ['🎵', 'K-POP · 드라마 · 영화 차트'],
          ['📝', '생활 가이드 블로그']
        ].map(([emoji, text]) => 
          `<div style="background:rgba(255,255,255,0.15);padding:20px 30px;border-radius:15px;font-size:26px;display:flex;align-items:center;gap:15px;backdrop-filter:blur(10px);">
            <span style="font-size:32px;">${emoji}</span>${text}
          </div>`
        ).join('')}
      </div>
      <div style="margin-top:40px;background:white;padding:16px 45px;border-radius:50px;font-size:24px;font-weight:700;color:#764ba2;">dalkonnect.com</div>
    </div>`
  },
  // 4. 맛집 TOP 카드
  {
    name: 'restaurant-top',
    width: 1080,
    height: 1350,
    html: `
    <div style="width:1080px;height:1350px;background:linear-gradient(180deg,#ff6b35 0%,#f7c59f 30%,#fff 50%);display:flex;flex-direction:column;align-items:center;font-family:'Noto Sans KR',sans-serif;padding:60px;box-sizing:border-box;">
      <div style="font-size:24px;color:white;font-weight:600;letter-spacing:3px;margin-bottom:15px;">🍽️ DFW 한인 맛집</div>
      <div style="font-size:52px;font-weight:800;color:white;margin-bottom:50px;">달라스 한식당 TOP 10</div>
      <div style="background:white;border-radius:20px;padding:30px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:12px;">
        ${[
          ['1', 'Gen Korean BBQ House', '⭐ 4.4', 'Plano'],
          ['2', 'Sura Korean Restaurant', '⭐ 4.5', 'Dallas'],
          ['3', '고려갈비', '⭐ 4.6', 'Dallas'],
          ['4', 'Kooksoo 국수', '⭐ 4.5', 'Plano'],
          ['5', '도마 설렁탕', '⭐ 4.5', 'Carrollton'],
          ['6', 'Burning Rice', '⭐ 4.7', 'Richardson'],
          ['7', '서울가든', '⭐ 4.3', 'Carrollton'],
          ['8', 'Gangnam Korean BBQ', '⭐ 4.5', 'Dallas'],
          ['9', 'CHO DANG VILLAGE', '⭐ 4.4', 'Dallas'],
          ['10', 'King 짬뽕', '⭐ 4.5', 'Carrollton']
        ].map(([rank, name, rating, city]) => 
          `<div style="display:flex;align-items:center;padding:14px 20px;border-radius:12px;${rank==='1'?'background:#fff5f0;':''}">
            <div style="width:45px;font-size:28px;font-weight:900;color:${rank<='3'?'#ff6b35':'#999'};">${rank}</div>
            <div style="flex:1;font-size:24px;font-weight:600;color:#333;">${name}</div>
            <div style="font-size:18px;color:#ff6b35;margin-right:15px;">${rating}</div>
            <div style="font-size:16px;color:#999;">${city}</div>
          </div>`
        ).join('')}
      </div>
      <div style="margin-top:30px;font-size:20px;color:#999;">더 많은 맛집은 dalkonnect.com에서</div>
      <div style="margin-top:15px;background:#ff6b35;padding:14px 40px;border-radius:50px;font-size:22px;font-weight:600;color:white;">dalkonnect.com →</div>
    </div>`
  },
  // 5. 커뮤니티 홍보
  {
    name: 'community-promo',
    width: 1080,
    height: 1080,
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(135deg,#00b4d8 0%,#0077b6 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:60px;box-sizing:border-box;">
      <div style="font-size:60px;margin-bottom:20px;">💬</div>
      <div style="font-size:48px;font-weight:800;margin-bottom:15px;text-align:center;">달라스 한인 커뮤니티</div>
      <div style="font-size:26px;opacity:0.8;margin-bottom:50px;">궁금한 거 물어보세요!</div>
      <div style="display:flex;flex-direction:column;gap:15px;width:100%;max-width:750px;">
        ${[
          '"Plano ISD vs Frisco ISD 어디가 나은가요?"',
          '"한인 세무사 추천 부탁드립니다"',
          '"DFW 공항 근처 한식당 추천?"',
          '"강아지 미용 어디서 하시나요?"',
          '"Richardson 아파트 추천해주세요"'
        ].map(q => 
          `<div style="background:rgba(255,255,255,0.2);padding:22px 30px;border-radius:15px;font-size:24px;backdrop-filter:blur(10px);">${q}</div>`
        ).join('')}
      </div>
      <div style="margin-top:40px;background:white;padding:16px 45px;border-radius:50px;font-size:24px;font-weight:700;color:#0077b6;">지금 참여하기 →</div>
      <div style="margin-top:15px;font-size:20px;opacity:0.7;">dalkonnect.com/community</div>
    </div>`
  }
];

async function generate() {
  console.log('🎨 SNS 카드 생성 시작...\n');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (const card of CARDS) {
    const page = await browser.newPage();
    await page.setViewport({ width: card.width, height: card.height });
    
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>
    </head>
    <body>${card.html}</body>
    </html>`;
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const filePath = path.join(OUTPUT_DIR, `${card.name}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    console.log(`✅ ${card.name}.png (${card.width}x${card.height})`);
    
    await page.close();
  }
  
  await browser.close();
  console.log(`\n🎉 완료! ${CARDS.length}개 카드 → ${OUTPUT_DIR}/`);
}

generate().catch(console.error);
