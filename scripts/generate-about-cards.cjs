/**
 * DalKonnect 어바웃/핀 카드 5장
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'about');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const NAVY = '#0B1F3A';
const TEAL = '#00B4A6';
const WHITE = '#FFFFFF';
const GRAY = '#F4F6FA';
const ORANGE = '#FF6B35';

const cards = [
  // A. 사용법
  {
    name: 'A-how-to-use',
    html: `
    <div style="width:1080px;height:1080px;background:${WHITE};font-family:'Noto Sans KR',Arial,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;">
      <!-- 상단 헤더 -->
      <div style="background:${NAVY};padding:48px 60px 36px;flex-shrink:0;">
        <div style="font-size:18px;letter-spacing:4px;color:${TEAL};font-weight:700;margin-bottom:12px;">HOW TO USE</div>
        <div style="font-size:52px;font-weight:900;color:${WHITE};line-height:1.2;">달커넥트<br/>이렇게 쓰세요!</div>
      </div>
      <!-- 스텝 리스트 -->
      <div style="flex:1;padding:40px 60px;display:flex;flex-direction:column;justify-content:center;gap:24px;">
        ${[
          ['🔍', '업소 찾기', '카테고리 선택 → 지도/리스트에서 원하는 업소 클릭', TEAL],
          ['📰', '뉴스 보기', 'DFW 로컬뉴스 + 한국 최신 소식 매일 업데이트', ORANGE],
          ['🛍️', '사고팔기', '달라스 한인 중고거래 · 나눔 · 구인구직 게시판', '#7C3AED'],
          ['🏷️', '딜 확인', 'H-Mart, 한인업소 특가 공동구매 모아보기', '#059669'],
          ['🎵', '차트 보기', 'K-POP · 드라마 · 영화 · 유튜브 랭킹 한눈에', '#DC2626'],
        ].map(([e, t, d, c]) => `
          <div style="display:flex;align-items:center;gap:20px;background:${GRAY};border-radius:16px;padding:20px 24px;border-left:5px solid ${c};">
            <div style="font-size:36px;flex-shrink:0;">${e}</div>
            <div>
              <div style="font-size:24px;font-weight:700;color:${NAVY};margin-bottom:4px;">${t}</div>
              <div style="font-size:18px;color:#666;">${d}</div>
            </div>
          </div>`).join('')}
      </div>
      <!-- 하단 -->
      <div style="background:${GRAY};padding:24px 60px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #E5E7EB;">
        <div style="font-size:20px;font-weight:700;color:${NAVY};">DalKonnect 달커넥트</div>
        <div style="background:${NAVY};padding:12px 32px;border-radius:50px;font-size:18px;font-weight:700;color:${TEAL};">dalkonnect.com</div>
      </div>
    </div>`
  },

  // B. 왜 만들었나
  {
    name: 'B-why-we-built',
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${NAVY} 0%,#0d2b44 100%);font-family:'Noto Sans KR',Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;box-sizing:border-box;padding:70px;">
      <!-- 배경 장식 -->
      <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(0,180,166,0.15) 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:-100px;left:-60px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,0.1) 0%,transparent 70%);"></div>
      
      <div style="font-size:64px;margin-bottom:24px;">💭</div>
      <div style="font-size:20px;letter-spacing:4px;color:${TEAL};font-weight:700;margin-bottom:20px;">OUR STORY</div>
      
      <div style="font-size:44px;font-weight:900;color:${WHITE};text-align:center;line-height:1.4;margin-bottom:40px;">
        달라스 처음 왔을 때<br/>
        <span style="color:${TEAL};">정보 찾기가 너무 힘들었어요.</span>
      </div>
      
      <div style="width:80px;height:3px;background:${TEAL};border-radius:2px;margin-bottom:40px;"></div>
      
      <div style="font-size:26px;color:rgba(255,255,255,0.75);text-align:center;line-height:1.8;margin-bottom:48px;">
        한인 병원이 어디 있는지,<br/>
        괜찮은 한식당은 어디인지,<br/>
        커뮤니티 소식은 어디서 보는지...<br/>
        <br/>
        <span style="color:${WHITE};font-weight:600;">그래서 만들었습니다.</span>
      </div>
      
      <div style="background:${TEAL};padding:18px 52px;border-radius:50px;font-size:26px;font-weight:800;color:${NAVY};">
        달라스 한인의 모든 것 — dalkonnect.com
      </div>
    </div>`
  },

  // C. 업소 등록
  {
    name: 'C-register-business',
    html: `
    <div style="width:1080px;height:1080px;background:${WHITE};font-family:'Noto Sans KR',Arial,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;">
      <!-- 상단 컬러 바 -->
      <div style="height:8px;background:linear-gradient(90deg,${TEAL},${NAVY});flex-shrink:0;"></div>
      
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;">
        <div style="font-size:72px;margin-bottom:24px;">🏪</div>
        <div style="font-size:20px;letter-spacing:4px;color:${TEAL};font-weight:700;margin-bottom:16px;">FOR BUSINESS OWNERS</div>
        <div style="font-size:56px;font-weight:900;color:${NAVY};text-align:center;line-height:1.3;margin-bottom:16px;">
          달라스에서<br/>사업하세요?
        </div>
        <div style="font-size:30px;font-weight:600;color:${TEAL};margin-bottom:48px;">달커넥트에 무료로 등록하세요!</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:860px;margin-bottom:48px;">
          ${[
            ['✅', '완전 무료', '등록 비용 없음'],
            ['👥', '1,168개 업소', '이미 등록된 한인 업소'],
            ['📍', '지도 노출', '달라스 한인들에게 발견'],
            ['📊', '매일 방문자', '커뮤니티 포털 트래픽'],
          ].map(([e, t, d]) => `
            <div style="background:${GRAY};border-radius:16px;padding:24px;display:flex;align-items:center;gap:16px;">
              <div style="font-size:32px;">${e}</div>
              <div>
                <div style="font-size:22px;font-weight:700;color:${NAVY};">${t}</div>
                <div style="font-size:16px;color:#888;">${d}</div>
              </div>
            </div>`).join('')}
        </div>
        
        <div style="background:${NAVY};padding:20px 56px;border-radius:50px;font-size:26px;font-weight:700;color:${TEAL};">
          👉 dalkonnect.com/businesses
        </div>
        <div style="font-size:18px;color:#aaa;margin-top:16px;">DM 또는 info@dalkonnect.com으로 연락주세요</div>
      </div>
    </div>`
  },

  // D. 웰컴
  {
    name: 'D-welcome',
    html: `
    <div style="width:1080px;height:1080px;background:linear-gradient(135deg,#0B1F3A 0%,#0d2b44 50%,#0B1F3A 100%);font-family:'Noto Sans KR',Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;box-sizing:border-box;padding:70px;">
      <!-- 별 장식 -->
      <div style="position:absolute;top:60px;left:60px;font-size:24px;opacity:0.3;">⭐</div>
      <div style="position:absolute;top:120px;right:100px;font-size:16px;opacity:0.2;">✨</div>
      <div style="position:absolute;bottom:100px;left:80px;font-size:20px;opacity:0.2;">⭐</div>
      <div style="position:absolute;bottom:60px;right:60px;font-size:28px;opacity:0.3;">✨</div>
      
      <div style="font-size:80px;margin-bottom:16px;">🇰🇷🤠</div>
      <div style="font-size:20px;letter-spacing:5px;color:${TEAL};font-weight:700;margin-bottom:20px;">WELCOME</div>
      <div style="font-size:64px;font-weight:900;color:${WHITE};text-align:center;line-height:1.2;margin-bottom:20px;">
        달라스 한인<br/>여러분 환영합니다!
      </div>
      <div style="width:80px;height:4px;background:${TEAL};border-radius:2px;margin-bottom:36px;"></div>
      <div style="font-size:26px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.8;margin-bottom:48px;">
        Dallas–Fort Worth에 사는<br/>
        한인 여러분을 위해<br/>
        달커넥트가 함께합니다 🙌
      </div>
      
      <!-- 팔로우 유도 -->
      <div style="border:2px solid ${TEAL};padding:20px 48px;border-radius:50px;font-size:24px;color:${TEAL};font-weight:700;margin-bottom:20px;">
        팔로우하고 함께해요 👆
      </div>
      <div style="font-size:20px;color:rgba(255,255,255,0.5);">@dalkonnect · dalkonnect.com</div>
    </div>`
  },

  // E. 달라스 한인의 구글맵
  {
    name: 'E-google-map-for-koreans',
    html: `
    <div style="width:1080px;height:1080px;background:${WHITE};font-family:'Noto Sans KR',Arial,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;">
      <!-- 상단 그라데이션 블록 -->
      <div style="background:${NAVY};padding:56px 60px;flex-shrink:0;position:relative;">
        <div style="position:absolute;top:0;right:0;width:300px;height:100%;background:radial-gradient(ellipse at right,rgba(0,180,166,0.2) 0%,transparent 70%);"></div>
        <div style="font-size:20px;letter-spacing:4px;color:${TEAL};font-weight:700;margin-bottom:16px;">THINK OF US AS...</div>
        <div style="font-size:56px;font-weight:900;color:${WHITE};line-height:1.3;">
          달라스 한인을 위한<br/>
          <span style="color:${TEAL};">구글맵 + 커뮤니티</span>
        </div>
      </div>
      
      <!-- 비교 카드 -->
      <div style="flex:1;padding:44px 60px;display:flex;flex-direction:column;justify-content:center;gap:0;">
        <div style="font-size:22px;font-weight:700;color:#999;margin-bottom:20px;">뭔가 찾고 싶을 때 달커넥트를 먼저 열어보세요</div>
        ${[
          ['한인 병원 찾을 때', '검색 → 지도에서 바로 확인'],
          ['한국 뉴스 볼 때', 'DFW + 한국 뉴스 한곳에서'],
          ['중고품 사고팔 때', '달라스 한인 커뮤니티 게시판'],
          ['맛집 추천 받고 싶을 때', '1,168개 한인 업소 리뷰 확인'],
          ['K-드라마 순위 볼 때', '넷플릭스·유튜브 차트 한눈에'],
        ].map(([q, a]) => `
          <div style="display:flex;align-items:center;border-bottom:1px solid #F0F0F0;padding:16px 0;gap:16px;">
            <div style="font-size:20px;color:#555;flex:1;">"${q}"</div>
            <div style="font-size:18px;color:${TEAL};font-weight:700;text-align:right;">→ ${a}</div>
          </div>`).join('')}
      </div>
      
      <!-- 하단 -->
      <div style="background:${NAVY};padding:24px 60px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:22px;font-weight:800;color:${WHITE};">DalKonnect 달커넥트</div>
        <div style="background:${TEAL};padding:12px 32px;border-radius:50px;font-size:20px;font-weight:700;color:${NAVY};">dalkonnect.com</div>
      </div>
    </div>`
  },
];

async function generate() {
  console.log('🚀 어바웃 카드 5장 생성 중...');
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
