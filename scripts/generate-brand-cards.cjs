/**
 * DalKonnect Brand System Cards — 9장
 * Base: Navy #0B1F3A | 카테고리별 accent 컬러
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'brand');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 브랜드 컬러 시스템
const B = {
  navy: '#0B1F3A',
  navy2: '#0d2744',
  white: '#FFFFFF',
  offwhite: 'rgba(255,255,255,0.85)',
  dim: 'rgba(255,255,255,0.5)',
  glass: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.1)',
  // 카테고리 컬러
  teal: '#00B4A6',     // 메인/업소록
  red: '#C41E3A',      // 뉴스
  pink: '#FF2D78',     // K-차트 (서울밤)
  purple: '#7B2FFF',   // K-차트 (서울밤)
  coral: '#E85D3B',    // 사고팔기/딜
  gold: '#C9A84C',     // 비즈니스
  green: '#059669',    // 커뮤니티
};

const base = (content) => `<html><head>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>*{margin:0;padding:0;box-sizing:border-box;}body{width:1080px;height:1080px;overflow:hidden;background:${B.navy};}</style>
</head><body>${content}</body></html>`;

// 공통 헤더 태그
const catTag = (label, color) =>
  `<div style="display:inline-flex;align-items:center;gap:8px;font-size:14px;letter-spacing:3px;color:${color};font-weight:700;border:1px solid ${color}50;padding:6px 16px;border-radius:50px;margin-bottom:20px;">${label}</div>`;

// 컬러 구분선
const divider = (color) =>
  `<div style="width:64px;height:3px;background:${color};border-radius:2px;margin-bottom:36px;"></div>`;

// 하단 브랜드 바
const brandBar = (accentColor) => `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 60px;border-top:1px solid ${B.border};background:rgba(0,0,0,0.2);flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};"></div>
      <span style="font-size:20px;font-weight:800;color:${B.white};">DalKonnect</span>
      <span style="font-size:16px;color:${B.dim};">달커넥트</span>
    </div>
    <div style="background:${accentColor};padding:10px 28px;border-radius:50px;font-size:17px;font-weight:700;color:${B.navy};">dalkonnect.com</div>
  </div>`;

const cards = [
  // ① 메인 소개 — Teal
  {
    name: '01-intro',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy} 0%,${B.navy2} 100%);display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-120px;right:-120px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${B.teal}22 0%,transparent 65%);"></div>
      <div style="position:absolute;bottom:-100px;left:-80px;width:450px;height:450px;border-radius:50%;background:radial-gradient(circle,${B.teal}15 0%,transparent 65%);"></div>
      
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px;text-align:center;">
        <div style="font-size:72px;margin-bottom:20px;">🇰🇷🤠</div>
        ${catTag('DALKONNECT · 달커넥트', B.teal)}
        <div style="font-size:84px;font-weight:900;color:${B.white};letter-spacing:-2px;margin-bottom:6px;">달커넥트</div>
        <div style="font-size:28px;font-weight:300;color:${B.teal};letter-spacing:5px;margin-bottom:32px;">DalKonnect</div>
        ${divider(B.teal)}
        <div style="font-size:36px;font-weight:700;color:${B.white};line-height:1.6;margin-bottom:12px;">달라스-포트워스<br/>한인 커뮤니티 포털</div>
        <div style="font-size:22px;color:${B.dim};margin-bottom:52px;">DFW 한인의 모든 것, 한 곳에서</div>
        <div style="background:${B.teal};padding:18px 56px;border-radius:50px;font-size:26px;font-weight:800;color:${B.navy};">dalkonnect.com</div>
      </div>
    </div>`)
  },

  // ② 업소록 — Teal
  {
    name: '02-directory',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:350px;height:350px;background:radial-gradient(circle,${B.teal}20 0%,transparent 70%);"></div>
      <div style="flex:1;padding:60px;display:flex;flex-direction:column;">
        <div style="margin-bottom:20px;">${catTag('📍 BUSINESS DIRECTORY', B.teal)}</div>
        <div style="font-size:50px;font-weight:900;color:${B.white};line-height:1.3;margin-bottom:12px;">DFW 한인 업소<br/>한 곳에서 찾으세요</div>
        <div style="margin-bottom:32px;">
          <span style="font-size:100px;font-weight:900;color:${B.teal};">1,168</span>
          <span style="font-size:30px;color:${B.dim};margin-left:6px;">개 업소</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:auto;">
          ${['🍽️ 한식당','💇 미용실','🏥 병·의원','⛪ 교회','🛒 한인마트','🏠 부동산','⚖️ 법률','🦷 치과','🥋 태권도','💅 네일','🎓 교육','🚗 자동차'].map(c =>
            `<div style="background:${B.glass};border:1px solid ${B.border};padding:10px 18px;border-radius:50px;font-size:17px;color:${B.white};">${c}</div>`
          ).join('')}
        </div>
      </div>
      ${brandBar(B.teal)}
    </div>`)
  },

  // ③ 뉴스+차트 — Red(뉴스) + Seoul Night(차트)
  {
    name: '03-news-charts',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
      <div style="flex:1;display:flex;flex-direction:column;padding:52px 60px;gap:24px;justify-content:center;">
        <!-- 뉴스 섹션 (레드) -->
        <div style="background:${B.glass};border:1px solid ${B.red}35;border-radius:24px;padding:30px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${B.red},transparent);"></div>
          <div style="font-size:14px;letter-spacing:3px;color:${B.red};font-weight:700;margin-bottom:10px;">📰 DAILY NEWS</div>
          <div style="font-size:40px;font-weight:800;color:${B.white};margin-bottom:6px;">DFW 뉴스 + 한국 소식</div>
          <div style="font-size:19px;color:${B.dim};">매일 업데이트 · 1,000개+ 기사</div>
        </div>
        <!-- 차트 섹션 (서울밤) -->
        <div style="background:${B.glass};border:1px solid ${B.pink}35;border-radius:24px;padding:30px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${B.pink},${B.purple},transparent);"></div>
          <div style="font-size:14px;letter-spacing:3px;color:${B.pink};font-weight:700;margin-bottom:10px;">🎵 K-CULTURE CHARTS</div>
          <div style="font-size:40px;font-weight:800;color:${B.white};margin-bottom:6px;">음악 · 드라마 · 영화</div>
          <div style="font-size:19px;color:${B.dim};">넷플릭스 · 유튜브 · 멜론 매일 업데이트</div>
        </div>
        <!-- 설명 -->
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:28px;font-weight:700;color:${B.white};margin-bottom:8px;">두 가지 다 달커넥트에서</div>
          <div style="font-size:20px;color:${B.dim};">로컬부터 글로벌까지, 한 앱에서</div>
        </div>
      </div>
      ${brandBar(B.teal)}
    </div>`)
  },

  // ④ 커뮤니티 — Green
  {
    name: '04-community',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;width:350px;height:350px;background:radial-gradient(circle,${B.green}20 0%,transparent 70%);"></div>
      <div style="flex:1;padding:56px 60px;display:flex;flex-direction:column;">
        ${catTag('🤝 COMMUNITY', B.green)}
        <div style="font-size:54px;font-weight:900;color:${B.white};line-height:1.3;margin-bottom:44px;">달라스 한인<br/>커뮤니티 공간</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1;">
          ${[
            [B.green,'💬','자유 게시판','달라스 한인들의 이야기'],
            [B.coral,'🛍️','사고팔기','중고거래 · 나눔 · 구인구직'],
            [B.gold,'🏷️','공동구매 딜','H-Mart · 한인업소 특가'],
            [B.teal,'📍','업체 등록','내 가게를 달커넥트에'],
          ].map(([c,e,t,d]) => `
            <div style="background:${B.glass};border:1px solid ${c}30;border-radius:20px;padding:26px;position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${c};opacity:0.8;"></div>
              <div style="font-size:38px;margin-bottom:12px;">${e}</div>
              <div style="font-size:24px;font-weight:700;color:${B.white};margin-bottom:5px;">${t}</div>
              <div style="font-size:15px;color:${B.dim};">${d}</div>
            </div>`).join('')}
        </div>
      </div>
      ${brandBar(B.green)}
    </div>`)
  },

  // A. 사용법 — Teal
  {
    name: 'A-how-to-use',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
      <div style="flex:1;padding:52px 60px;display:flex;flex-direction:column;">
        ${catTag('HOW TO USE', B.teal)}
        <div style="font-size:54px;font-weight:900;color:${B.white};margin-bottom:40px;">달커넥트<br/>이렇게 쓰세요!</div>
        <div style="display:flex;flex-direction:column;gap:14px;flex:1;">
          ${[
            [B.teal,'🔍','업소 찾기','카테고리 → 지도/리스트에서 원하는 업소 클릭'],
            [B.red,'📰','뉴스 보기','DFW 로컬뉴스 + 한국 소식 매일 업데이트'],
            [B.coral,'🛍️','사고팔기','달라스 한인 중고거래 · 나눔 · 구인구직'],
            [B.gold,'🏷️','딜 확인','H-Mart, 한인업소 특가 공동구매'],
            [B.pink,'🎵','차트 보기','K-POP · 드라마 · 영화 · 유튜브 랭킹'],
          ].map(([c,e,t,d]) => `
            <div style="display:flex;align-items:center;gap:16px;background:${B.glass};border:1px solid ${c}25;border-radius:14px;padding:16px 20px;">
              <div style="width:4px;height:44px;background:${c};border-radius:2px;flex-shrink:0;"></div>
              <div style="font-size:30px;flex-shrink:0;">${e}</div>
              <div>
                <div style="font-size:21px;font-weight:700;color:${B.white};">${t}</div>
                <div style="font-size:15px;color:${B.dim};">${d}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      ${brandBar(B.teal)}
    </div>`)
  },

  // B. 왜 만들었나 — Teal
  {
    name: 'B-why-we-built',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;padding:80px;position:relative;overflow:hidden;text-align:center;">
      <div style="position:absolute;top:-60px;right:-60px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${B.teal}18 0%,transparent 65%);"></div>
      <div style="position:absolute;bottom:-80px;left:-60px;width:450px;height:450px;border-radius:50%;background:radial-gradient(circle,${B.teal}10 0%,transparent 65%);"></div>
      <div style="font-size:64px;margin-bottom:18px;">💭</div>
      ${catTag('OUR STORY', B.teal)}
      <div style="font-size:48px;font-weight:900;color:${B.white};line-height:1.4;margin-bottom:32px;">달라스 처음 왔을 때<br/><span style="color:${B.teal};">정보 찾기가 너무 힘들었어요.</span></div>
      ${divider(B.teal)}
      <div style="font-size:26px;color:${B.dim};line-height:1.9;margin-bottom:48px;">한인 병원이 어디 있는지,<br/>괜찮은 한식당은 어디인지,<br/>커뮤니티 소식은 어디서 보는지...<br/><span style="color:${B.white};font-weight:700;">그래서 만들었습니다.</span></div>
      <div style="background:${B.teal};padding:18px 52px;border-radius:50px;font-size:24px;font-weight:800;color:${B.navy};">달라스 한인의 모든 것 — dalkonnect.com</div>
    </div>`)
  },

  // C. 업소 등록 — Gold
  {
    name: 'C-register-business',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
      <div style="position:absolute;bottom:0;right:0;width:380px;height:380px;background:radial-gradient(circle,${B.gold}20 0%,transparent 70%);"></div>
      <div style="flex:1;padding:56px 60px;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;">
        <div style="font-size:68px;margin-bottom:16px;">🏪</div>
        ${catTag('FOR BUSINESS OWNERS', B.gold)}
        <div style="font-size:58px;font-weight:900;color:${B.white};line-height:1.3;margin-bottom:14px;">달라스에서<br/>사업하세요?</div>
        <div style="font-size:28px;color:${B.gold};font-weight:700;margin-bottom:40px;">달커넥트에 무료로 등록하세요!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;max-width:840px;margin-bottom:36px;">
          ${[
            [B.teal,'✅','완전 무료','등록 비용 없음'],
            [B.gold,'👥','1,168개 업소','이미 등록된 한인 업소'],
            [B.coral,'📍','지도 노출','달라스 한인들에게 발견'],
            [B.green,'📊','매일 방문자','커뮤니티 포털 트래픽'],
          ].map(([c,e,t,d]) => `
            <div style="background:${B.glass};border:1px solid ${c}30;border-radius:14px;padding:18px;display:flex;align-items:center;gap:12px;text-align:left;">
              <div style="font-size:26px;">${e}</div>
              <div>
                <div style="font-size:19px;font-weight:700;color:${B.white};">${t}</div>
                <div style="font-size:14px;color:${B.dim};">${d}</div>
              </div>
            </div>`).join('')}
        </div>
        <div style="background:${B.gold};padding:16px 48px;border-radius:50px;font-size:22px;font-weight:700;color:${B.navy};">👉 dalkonnect.com/businesses</div>
        <div style="font-size:16px;color:${B.dim};margin-top:12px;">DM 또는 info@dalkonnect.com</div>
      </div>
    </div>`)
  },

  // D. 웰컴 — Teal
  {
    name: 'D-welcome',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;padding:80px;position:relative;overflow:hidden;text-align:center;">
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:700px;height:280px;background:radial-gradient(ellipse,${B.teal}15 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:700px;height:250px;background:radial-gradient(ellipse,${B.teal}10 0%,transparent 70%);"></div>
      <div style="font-size:80px;margin-bottom:14px;">🇰🇷🤠</div>
      ${catTag('WELCOME TO DALKONNECT', B.teal)}
      <div style="font-size:62px;font-weight:900;color:${B.white};line-height:1.25;margin-bottom:18px;">달라스 한인<br/>여러분 환영합니다!</div>
      ${divider(B.teal)}
      <div style="font-size:26px;color:${B.dim};line-height:1.9;margin-bottom:48px;">Dallas–Fort Worth에 사는<br/>한인 여러분을 위해<br/>달커넥트가 함께합니다 🙌</div>
      <div style="border:2px solid ${B.teal};padding:18px 48px;border-radius:50px;font-size:24px;font-weight:700;color:${B.teal};margin-bottom:16px;">팔로우하고 함께해요 👆</div>
      <div style="font-size:18px;color:${B.dim};">@dalkonnect · dalkonnect.com</div>
    </div>`)
  },

  // E. 구글맵 — Teal
  {
    name: 'E-google-map',
    html: base(`
    <div style="width:1080px;height:1080px;background:linear-gradient(160deg,${B.navy},${B.navy2});display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:380px;height:380px;background:radial-gradient(circle,${B.teal}15 0%,transparent 70%);"></div>
      <div style="padding:52px 60px 32px;flex-shrink:0;">
        <div style="font-size:14px;letter-spacing:4px;color:${B.teal};font-weight:700;margin-bottom:14px;">THINK OF US AS...</div>
        <div style="font-size:50px;font-weight:900;color:${B.white};line-height:1.3;">달라스 한인을 위한<br/><span style="color:${B.teal};">구글맵 + 커뮤니티</span></div>
      </div>
      <div style="flex:1;padding:0 60px;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:18px;color:${B.dim};margin-bottom:16px;">뭔가 찾고 싶을 때 달커넥트를 먼저 여세요</div>
        ${[
          ['한인 병원 찾을 때','검색 → 지도에서 바로 확인',B.teal],
          ['한국 뉴스 볼 때','DFW + 한국 뉴스 한곳에서',B.red],
          ['중고품 사고팔 때','달라스 한인 커뮤니티 게시판',B.coral],
          ['맛집 추천 받고 싶을 때','1,168개 한인 업소 확인',B.gold],
          ['K-드라마 순위 볼 때','넷플릭스·유튜브 차트 한눈에',B.pink],
        ].map(([q,a,c]) => `
          <div style="display:flex;align-items:center;border-bottom:1px solid ${B.border};padding:16px 0;gap:14px;">
            <div style="width:4px;height:32px;background:${c};border-radius:2px;flex-shrink:0;"></div>
            <div style="font-size:19px;color:${B.offwhite};flex:1;">"${q}"</div>
            <div style="font-size:17px;color:${c};font-weight:700;text-align:right;">→ ${a}</div>
          </div>`).join('')}
      </div>
      ${brandBar(B.teal)}
    </div>`)
  },
];

async function generate() {
  console.log('🎨 브랜드 시스템 카드 9장 생성 중...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const card of cards) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(card.html, { waitUntil: 'networkidle0', timeout: 30000 });
    const outPath = path.join(OUTPUT_DIR, `${card.name}.png`);
    await page.screenshot({ path: outPath, type: 'png', clip: { x:0,y:0,width:1080,height:1080 } });
    console.log(`  ✅ ${card.name}.png`);
    await page.close();
  }
  await browser.close();
  console.log(`\n✅ 완료! ${OUTPUT_DIR}`);
}

generate().catch(console.error);
