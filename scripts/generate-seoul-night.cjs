/**
 * DalKonnect Seoul Night 컨셉 카드 — 전체 9장
 * 배경: #0D0D1A | 포인트: #FF2D78 (핑크) + #7B2FFF (퍼플) | 텍스트: 흰색
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'seoul-night');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const C = {
  bg: '#0D0D1A',
  bg2: '#12122A',
  pink: '#FF2D78',
  purple: '#7B2FFF',
  purpleLight: '#A855F7',
  white: '#FFFFFF',
  gray: 'rgba(255,255,255,0.08)',
  grayText: 'rgba(255,255,255,0.55)',
  glow: 'rgba(255,45,120,0.3)',
  glowPurple: 'rgba(123,47,255,0.3)',
};

const base = (content) => `
<html><head>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{width:1080px;height:1080px;overflow:hidden;background:${C.bg};}
  </style>
</head><body>${content}</body></html>`;

const gradBg = `background:linear-gradient(160deg,${C.bg} 0%,${C.bg2} 100%)`;
const pinkGlow = `box-shadow:0 0 60px ${C.glow}`;
const purpleGlow = `box-shadow:0 0 60px ${C.glowPurple}`;

const tag = (text, color = C.pink) =>
  `<div style="display:inline-block;font-size:15px;letter-spacing:4px;color:${color};font-weight:700;border:1px solid ${color}40;padding:6px 18px;border-radius:50px;margin-bottom:20px;">${text}</div>`;

const dot = `<div style="width:6px;height:6px;border-radius:50%;background:${C.pink};margin:0 8px;display:inline-block;"></div>`;

const cards = [
  // 1. 달커넥트 소개
  {
    name: '01-intro',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:70px;">
      <!-- 글로우 오브 -->
      <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${C.glowPurple} 0%,transparent 65%);"></div>
      <div style="position:absolute;bottom:-150px;left:-80px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,${C.glow} 0%,transparent 65%);"></div>
      
      <div style="font-size:72px;margin-bottom:20px;filter:drop-shadow(0 0 20px rgba(255,255,255,0.5));">🇰🇷🤠</div>
      ${tag('DALKONNECT · 달커넥트')}
      <div style="font-size:80px;font-weight:900;color:${C.white};letter-spacing:-2px;margin-bottom:8px;text-shadow:0 0 40px ${C.glow};">달커넥트</div>
      <div style="font-size:28px;font-weight:300;background:linear-gradient(90deg,${C.pink},${C.purpleLight});-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;margin-bottom:44px;">DalKonnect</div>
      <div style="width:100px;height:2px;background:linear-gradient(90deg,${C.pink},${C.purple});margin-bottom:44px;border-radius:2px;"></div>
      <div style="font-size:36px;font-weight:700;color:${C.white};text-align:center;line-height:1.6;margin-bottom:14px;">달라스-포트워스<br/>한인 커뮤니티 포털</div>
      <div style="font-size:22px;color:${C.grayText};margin-bottom:52px;">DFW 한인의 모든 것, 한 곳에서</div>
      <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:18px 56px;border-radius:50px;font-size:26px;font-weight:800;color:${C.white};${pinkGlow};">dalkonnect.com</div>
    </div>`)
  },

  // 2. 업소록
  {
    name: '02-directory',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;padding:60px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:400px;height:400px;background:radial-gradient(circle,${C.glowPurple} 0%,transparent 70%);"></div>
      
      <div style="margin-bottom:32px;">${tag('📍 BUSINESS DIRECTORY')}</div>
      <div style="font-size:48px;font-weight:900;color:${C.white};line-height:1.3;margin-bottom:8px;">DFW 한인 업소<br/>한 곳에서 찾으세요</div>
      <div style="margin-bottom:36px;">
        <span style="font-size:96px;font-weight:900;background:linear-gradient(90deg,${C.pink},${C.purpleLight});-webkit-background-clip:text;-webkit-text-fill-color:transparent;">1,168</span>
        <span style="font-size:32px;color:${C.grayText};margin-left:8px;">개 업소</span>
      </div>
      
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:auto;">
        ${['🍽️ 한식당','💇 미용실','🏥 병·의원','⛪ 교회','🛒 한인마트','🏠 부동산','⚖️ 법률','🦷 치과','🥋 태권도','💅 네일','🎓 교육','🚗 자동차'].map(c =>
          `<div style="background:${C.gray};border:1px solid rgba(255,255,255,0.1);padding:12px 20px;border-radius:50px;font-size:19px;color:${C.white};">${c}</div>`
        ).join('')}
      </div>
      
      <div style="margin-top:36px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:20px;color:${C.grayText};">@dalkonnect</div>
        <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:14px 40px;border-radius:50px;font-size:22px;font-weight:700;color:${C.white};">지금 검색하기 →</div>
      </div>
    </div>`)
  },

  // 3. 뉴스 & 차트
  {
    name: '03-news-charts',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;padding:60px;position:relative;overflow:hidden;">
      <div style="position:absolute;bottom:0;right:0;width:450px;height:450px;background:radial-gradient(circle,${C.glow} 0%,transparent 70%);"></div>
      
      <div style="margin-bottom:36px;">${tag('📰 NEWS & CHARTS')}</div>
      
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px;">
        <!-- 뉴스 섹션 -->
        <div style="background:${C.gray};border:1px solid rgba(255,45,120,0.2);border-radius:24px;padding:32px;position:relative;">
          <div style="position:absolute;top:-1px;left:32px;right:32px;height:2px;background:linear-gradient(90deg,${C.pink},transparent);border-radius:2px;"></div>
          <div style="font-size:18px;letter-spacing:3px;color:${C.pink};font-weight:700;margin-bottom:12px;">DAILY NEWS</div>
          <div style="font-size:40px;font-weight:800;color:${C.white};margin-bottom:8px;">DFW 뉴스 + 한국 소식</div>
          <div style="font-size:20px;color:${C.grayText};">매일 업데이트 · 1,000개+ 기사</div>
        </div>
        <!-- 차트 섹션 -->
        <div style="background:${C.gray};border:1px solid rgba(123,47,255,0.2);border-radius:24px;padding:32px;position:relative;">
          <div style="position:absolute;top:-1px;left:32px;right:32px;height:2px;background:linear-gradient(90deg,${C.purple},transparent);border-radius:2px;"></div>
          <div style="font-size:18px;letter-spacing:3px;color:${C.purpleLight};font-weight:700;margin-bottom:12px;">K-CULTURE CHARTS</div>
          <div style="font-size:40px;font-weight:800;color:${C.white};margin-bottom:8px;">음악 · 드라마 · 영화</div>
          <div style="font-size:20px;color:${C.grayText};">넷플릭스 · 유튜브 · 멜론 매일 업데이트</div>
        </div>
      </div>
      
      <div style="margin-top:36px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:22px;font-weight:800;color:${C.white};">DalKonnect</div>
        <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:14px 40px;border-radius:50px;font-size:20px;font-weight:700;color:${C.white};">dalkonnect.com</div>
      </div>
    </div>`)
  },

  // 4. 커뮤니티
  {
    name: '04-community',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;padding:60px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;width:400px;height:400px;background:radial-gradient(circle,${C.glowPurple} 0%,transparent 70%);"></div>
      
      <div style="margin-bottom:28px;">${tag('🤝 COMMUNITY', C.purpleLight)}</div>
      <div style="font-size:52px;font-weight:900;color:${C.white};line-height:1.3;margin-bottom:48px;">달라스 한인<br/>커뮤니티 공간</div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">
        ${[
          [C.pink,'💬','자유 게시판','달라스 한인들의 이야기'],
          [C.purpleLight,'🛍️','사고팔기','중고거래 · 나눔 · 구인구직'],
          ['#FF9F1C','🏷️','공동구매 딜','H-Mart · 한인업소 특가'],
          ['#00E5A0','📍','업체 등록','내 가게를 달커넥트에'],
        ].map(([color, e, t, d]) => `
          <div style="background:${C.gray};border:1px solid ${color}30;border-radius:20px;padding:28px;position:relative;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${color},transparent);border-radius:20px 20px 0 0;"></div>
            <div style="font-size:40px;margin-bottom:14px;">${e}</div>
            <div style="font-size:26px;font-weight:700;color:${C.white};margin-bottom:6px;">${t}</div>
            <div style="font-size:17px;color:${C.grayText};">${d}</div>
          </div>`).join('')}
      </div>
      
      <div style="margin-top:32px;text-align:center;">
        <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:16px 48px;border-radius:50px;font-size:24px;font-weight:800;color:${C.white};display:inline-block;">dalkonnect.com</div>
      </div>
    </div>`)
  },

  // A. 사용법
  {
    name: 'A-how-to-use',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;padding:60px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:350px;height:350px;background:radial-gradient(circle,${C.glow} 0%,transparent 70%);"></div>
      
      <div style="margin-bottom:20px;">${tag('HOW TO USE')}</div>
      <div style="font-size:54px;font-weight:900;color:${C.white};margin-bottom:44px;">달커넥트<br/>이렇게 쓰세요!</div>
      
      <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
        ${[
          [C.pink,'🔍','업소 찾기','카테고리 → 지도/리스트에서 원하는 업소 클릭'],
          [C.purpleLight,'📰','뉴스 보기','DFW 로컬뉴스 + 한국 최신 소식 매일 업데이트'],
          ['#FF9F1C','🛍️','사고팔기','달라스 한인 중고거래 · 나눔 · 구인구직'],
          ['#00E5A0','🏷️','딜 확인','H-Mart, 한인업소 특가 공동구매 모아보기'],
          ['#38BDF8','🎵','차트 보기','K-POP · 드라마 · 영화 · 유튜브 랭킹'],
        ].map(([color, e, t, d]) => `
          <div style="display:flex;align-items:center;gap:18px;background:${C.gray};border:1px solid ${color}25;border-radius:16px;padding:18px 22px;">
            <div style="width:4px;height:48px;background:${color};border-radius:2px;flex-shrink:0;"></div>
            <div style="font-size:32px;flex-shrink:0;">${e}</div>
            <div>
              <div style="font-size:22px;font-weight:700;color:${C.white};">${t}</div>
              <div style="font-size:16px;color:${C.grayText};">${d}</div>
            </div>
          </div>`).join('')}
      </div>
      
      <div style="margin-top:28px;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:18px;color:${C.grayText};">@dalkonnect</div>
        <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:14px 36px;border-radius:50px;font-size:20px;font-weight:700;color:${C.white};">dalkonnect.com</div>
      </div>
    </div>`)
  },

  // B. 왜 만들었나
  {
    name: 'B-why-we-built',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;position:relative;overflow:hidden;text-align:center;">
      <div style="position:absolute;top:-80px;right:-80px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${C.glowPurple} 0%,transparent 65%);"></div>
      <div style="position:absolute;bottom:-100px;left:-60px;width:450px;height:450px;border-radius:50%;background:radial-gradient(circle,${C.glow} 0%,transparent 65%);"></div>
      
      <div style="font-size:64px;margin-bottom:20px;">💭</div>
      ${tag('OUR STORY')}
      <div style="font-size:48px;font-weight:900;color:${C.white};line-height:1.4;margin-bottom:36px;">
        달라스 처음 왔을 때<br/>
        <span style="background:linear-gradient(90deg,${C.pink},${C.purpleLight});-webkit-background-clip:text;-webkit-text-fill-color:transparent;">정보 찾기가 너무 힘들었어요.</span>
      </div>
      <div style="width:80px;height:2px;background:linear-gradient(90deg,${C.pink},${C.purple});margin-bottom:36px;"></div>
      <div style="font-size:26px;color:${C.grayText};line-height:1.9;margin-bottom:52px;">
        한인 병원이 어디 있는지,<br/>
        괜찮은 한식당은 어디인지,<br/>
        커뮤니티 소식은 어디서 보는지...<br/>
        <span style="color:${C.white};font-weight:700;">그래서 만들었습니다.</span>
      </div>
      <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:20px 56px;border-radius:50px;font-size:26px;font-weight:800;color:${C.white};${pinkGlow};">달라스 한인의 모든 것 — dalkonnect.com</div>
    </div>`)
  },

  // C. 업소 등록
  {
    name: 'C-register-business',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;position:relative;overflow:hidden;text-align:center;">
      <div style="position:absolute;bottom:0;right:0;width:400px;height:400px;background:radial-gradient(circle,${C.glowPurple} 0%,transparent 70%);"></div>
      
      <div style="font-size:72px;margin-bottom:20px;">🏪</div>
      ${tag('FOR BUSINESS OWNERS', C.purpleLight)}
      <div style="font-size:58px;font-weight:900;color:${C.white};line-height:1.3;margin-bottom:16px;">달라스에서<br/>사업하세요?</div>
      <div style="font-size:28px;background:linear-gradient(90deg,${C.pink},${C.purpleLight});-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700;margin-bottom:44px;">달커넥트에 무료로 등록하세요!</div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:860px;margin-bottom:44px;">
        ${[
          [C.pink,'✅','완전 무료','등록 비용 없음'],
          [C.purpleLight,'👥','1,168개 업소','이미 등록된 한인 업소'],
          ['#FF9F1C','📍','지도 노출','달라스 한인들에게 발견'],
          ['#00E5A0','📊','매일 방문자','커뮤니티 포털 트래픽'],
        ].map(([c,e,t,d]) => `
          <div style="background:${C.gray};border:1px solid ${c}30;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;text-align:left;">
            <div style="font-size:28px;">${e}</div>
            <div>
              <div style="font-size:20px;font-weight:700;color:${C.white};">${t}</div>
              <div style="font-size:15px;color:${C.grayText};">${d}</div>
            </div>
          </div>`).join('')}
      </div>
      
      <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:18px 52px;border-radius:50px;font-size:24px;font-weight:700;color:${C.white};${pinkGlow};margin-bottom:14px;">👉 dalkonnect.com/businesses</div>
      <div style="font-size:17px;color:${C.grayText};">DM 또는 info@dalkonnect.com</div>
    </div>`)
  },

  // D. 웰컴
  {
    name: 'D-welcome',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;position:relative;overflow:hidden;text-align:center;">
      <!-- 글로우 오브 2개 -->
      <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:600px;height:300px;background:radial-gradient(ellipse,${C.glowPurple} 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);width:700px;height:300px;background:radial-gradient(ellipse,${C.glow} 0%,transparent 70%);"></div>
      
      <!-- 별 장식 -->
      <div style="position:absolute;top:80px;left:80px;font-size:22px;opacity:0.4;">✦</div>
      <div style="position:absolute;top:140px;right:100px;font-size:14px;opacity:0.3;">✦</div>
      <div style="position:absolute;bottom:120px;left:100px;font-size:18px;opacity:0.3;">✦</div>
      <div style="position:absolute;bottom:80px;right:80px;font-size:26px;opacity:0.4;">✦</div>
      
      <div style="font-size:80px;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(255,255,255,0.4));">🇰🇷🤠</div>
      ${tag('WELCOME TO DALKONNECT')}
      <div style="font-size:60px;font-weight:900;color:${C.white};line-height:1.25;margin-bottom:20px;text-shadow:0 0 40px ${C.glow};">달라스 한인<br/>여러분 환영합니다!</div>
      <div style="width:80px;height:2px;background:linear-gradient(90deg,${C.pink},${C.purple});margin:0 auto 36px;"></div>
      <div style="font-size:26px;color:${C.grayText};line-height:1.9;margin-bottom:52px;">
        Dallas–Fort Worth에 사는<br/>
        한인 여러분을 위해<br/>
        달커넥트가 함께합니다 🙌
      </div>
      <div style="border:2px solid transparent;background:linear-gradient(${C.bg},${C.bg}) padding-box,linear-gradient(90deg,${C.pink},${C.purple}) border-box;padding:18px 48px;border-radius:50px;font-size:24px;font-weight:700;color:${C.white};margin-bottom:18px;">팔로우하고 함께해요 👆</div>
      <div style="font-size:18px;color:${C.grayText};">@dalkonnect · dalkonnect.com</div>
    </div>`)
  },

  // E. 구글맵
  {
    name: 'E-google-map',
    html: base(`
    <div style="width:1080px;height:1080px;${gradBg};font-family:'Noto Sans KR',sans-serif;display:flex;flex-direction:column;padding:0;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:400px;height:400px;background:radial-gradient(circle,${C.glow} 0%,transparent 70%);"></div>
      
      <!-- 헤더 -->
      <div style="padding:52px 60px 40px;flex-shrink:0;">
        <div style="font-size:16px;letter-spacing:4px;color:${C.pink};font-weight:700;margin-bottom:14px;">THINK OF US AS...</div>
        <div style="font-size:50px;font-weight:900;color:${C.white};line-height:1.3;">
          달라스 한인을 위한<br/>
          <span style="background:linear-gradient(90deg,${C.pink},${C.purpleLight});-webkit-background-clip:text;-webkit-text-fill-color:transparent;">구글맵 + 커뮤니티</span>
        </div>
      </div>
      
      <!-- 리스트 -->
      <div style="flex:1;padding:0 60px;display:flex;flex-direction:column;justify-content:center;gap:0;">
        <div style="font-size:19px;color:${C.grayText};margin-bottom:18px;">뭔가 찾고 싶을 때 달커넥트를 먼저 여세요</div>
        ${[
          ['한인 병원 찾을 때','검색 → 지도에서 바로 확인',C.pink],
          ['한국 뉴스 볼 때','DFW + 한국 뉴스 한곳에서',C.purpleLight],
          ['중고품 사고팔 때','달라스 한인 커뮤니티 게시판','#FF9F1C'],
          ['맛집 추천 받고 싶을 때','1,168개 한인 업소 확인','#00E5A0'],
          ['K-드라마 순위 볼 때','넷플릭스·유튜브 차트 한눈에','#38BDF8'],
        ].map(([q, a, c]) => `
          <div style="display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,0.07);padding:18px 0;gap:16px;">
            <div style="width:4px;height:36px;background:${c};border-radius:2px;flex-shrink:0;"></div>
            <div style="font-size:20px;color:rgba(255,255,255,0.7);flex:1;">"${q}"</div>
            <div style="font-size:18px;color:${c};font-weight:700;">→ ${a}</div>
          </div>`).join('')}
      </div>
      
      <!-- 하단 -->
      <div style="padding:28px 60px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:22px;font-weight:800;color:${C.white};">DalKonnect 달커넥트</div>
        <div style="background:linear-gradient(90deg,${C.pink},${C.purple});padding:14px 36px;border-radius:50px;font-size:20px;font-weight:700;color:${C.white};">dalkonnect.com</div>
      </div>
    </div>`)
  },
];

async function generate() {
  console.log('🌙 Seoul Night 카드 9장 생성 중...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const card of cards) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(card.html, { waitUntil: 'networkidle0', timeout: 30000 });
    const outPath = path.join(OUTPUT_DIR, `${card.name}.png`);
    await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    console.log(`  ✅ ${card.name}.png`);
    await page.close();
  }
  await browser.close();
  console.log(`\n✅ 완료! ${OUTPUT_DIR}`);
}

generate().catch(console.error);
