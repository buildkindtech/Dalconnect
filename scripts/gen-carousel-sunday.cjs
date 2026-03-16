/**
 * DalKonnect Sunday Carousel Cards — 중앙 정렬
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'sns-cards', 'carousel-sunday');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function shot(html, filename) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  return out;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}`;

const logo = (color='#2ED8A3') => `<div style="display:flex;align-items:center;justify-content:center;gap:8px;">
  <div style="width:10px;height:10px;background:${color};border-radius:50%;"></div>
  <span style="font-size:24px;font-weight:800;color:#fff;">DalKonnect</span>
</div>`;

// ══════════════════════════════════════════════════════
// POST 1: 교회 찾기
// ══════════════════════════════════════════════════════
const churchSlides = [
  // 커버 — 완전 중앙
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 40%,rgba(46,216,163,0.08),transparent 60%)"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:20px;">⛪</div>
    <div style="color:#2ED8A3;font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:16px;">SUNDAY SPECIAL</div>
    <h1 style="font-size:88px;font-weight:900;color:#fff;line-height:1.0;margin-bottom:20px;">DFW<br>한인교회<br><span style="color:#2ED8A3;">찾기 가이드</span></h1>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:36px;">달라스 한인교회 실제 리뷰 기반<br>지역별 TOP 추천</p>
    <div style="color:#6b7280;font-size:20px;margin-bottom:32px;">스와이프 →</div>
    ${logo()}
  </div></body></html>`,

  // 달라스/어빙
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="display:inline-block;background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.4);padding:10px 28px;border-radius:40px;margin-bottom:12px;">
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">📍 달라스 · 어빙</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        ['DALLAS WOORI REFORMED','5.0⭐ · 60 reviews · Dallas'],
        ['달라스 중앙감리교회','4.8⭐ · 100 reviews · Irving'],
        ['The Life Church - Dallas','4.7⭐ · 104 reviews · Dallas'],
        ['St. Andrew Kim Catholic Church','4.8⭐ · 96 reviews · Irving'],
      ].map(([name,sub],i) => `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px 28px;display:flex;align-items:center;gap:18px;">
        <div style="width:50px;height:50px;background:rgba(46,216,163,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#2ED8A3;flex-shrink:0;">${i+1}</div>
        <div>
          <div style="color:#fff;font-size:23px;font-weight:800;">${name}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:3px;">${sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo()}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;">1 / 3 지역</div>
  </div></body></html>`,

  // 캐럴턴/리차드슨
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="display:inline-block;background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.4);padding:10px 28px;border-radius:40px;margin-bottom:12px;">
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">📍 캐럴턴 · 리차드슨</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        ['Semihan Church','4.7⭐ · 157 reviews · Carrollton'],
        ['뉴송교회','4.7⭐ · 97 reviews · Carrollton'],
        ['빛내리 교회','4.8⭐ · 54 reviews · Richardson'],
        ['Hanuri Church','4.8⭐ · 43 reviews · Carrollton'],
      ].map(([name,sub],i) => `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px 28px;display:flex;align-items:center;gap:18px;">
        <div style="width:50px;height:50px;background:rgba(46,216,163,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#2ED8A3;flex-shrink:0;">${i+1}</div>
        <div>
          <div style="color:#fff;font-size:23px;font-weight:800;">${name}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:3px;">${sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo()}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;">2 / 3 지역</div>
  </div></body></html>`,

  // 플라노/프리스코
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="display:inline-block;background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.4);padding:10px 28px;border-radius:40px;margin-bottom:12px;">
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">📍 플라노 · 프리스코 · 루이스빌</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        ['영락 장로 교회','4.6⭐ · 73 reviews · Plano'],
        ['Semihan Church North Campus','5.0⭐ · 38 reviews · Frisco'],
        ['Resemblance Of Christ (예닮교회)','5.0⭐ · 19 reviews · Lewisville'],
        ['플라워마운드교회','4.6⭐ · 30 reviews · Flower Mound'],
      ].map(([name,sub],i) => `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px 28px;display:flex;align-items:center;gap:18px;">
        <div style="width:50px;height:50px;background:rgba(46,216,163,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#2ED8A3;flex-shrink:0;">${i+1}</div>
        <div>
          <div style="color:#fff;font-size:23px;font-weight:800;">${name}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:3px;">${sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo()}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;">3 / 3 지역</div>
  </div></body></html>`,

  // CTA
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0B1220;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:24px;">🔍</div>
    <h2 style="font-size:64px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:20px;">달라스 한인교회<br><span style="color:#2ED8A3;">전체 목록 보기</span></h2>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:40px;">달커넥트에 등록된 한인교회<br>카테고리 → 교회 선택</p>
    <div style="background:#2ED8A3;padding:20px 48px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#0B1220;font-size:24px;font-weight:900;">dalkonnect.com/businesses</span>
    </div>
    ${logo()}
  </div></body></html>`,
];

// ══════════════════════════════════════════════════════
// POST 2: 뉴스 캐러셀
// ══════════════════════════════════════════════════════
const newsItems = [
  {emoji:'🕵️',cat:'국제',color:'#7B2FFF',title:'북한 공작원들, AI로 유럽 대기업 위장취업',desc:'북한이 AI를 활용해 유럽 기업에 IT 인력으로 위장취업시키고 외화를 벌어들이고 있다.'},
  {emoji:'🇺🇸',cat:'미국',color:'#C41E3A',title:'트럼프, 이란전 보도에 격분…방송사 압박',desc:'트럼프 대통령이 이란 관련 방송 보도에 강하게 반발하며 방송사 면허 취소를 시사했다.'},
  {emoji:'⚡',cat:'세계',color:'#f97316',title:'이란, 걸프 국가들에 미사일 위협 경고',desc:'이란이 미국 공격 시 UAE와 바레인을 포함한 걸프 국가 미군 기지를 표적으로 경고했다.'},
  {emoji:'💪',cat:'DFW',color:'#2ED8A3',title:'달라스 십대 암 생존자, 지역사회 봉사로 주목',desc:'암을 이겨낸 달라스 십대가 메이크어위시 소원을 지역사회 봉사 활동으로 채워 화제.'},
];

const newsSlides = [
  // 커버
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0d0d0d;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:20px;">📰</div>
    <div style="color:#f97316;font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:16px;">THIS WEEK · 2026.03.15</div>
    <h1 style="font-size:88px;font-weight:900;color:#fff;line-height:1.0;margin-bottom:20px;">이번 주<br><span style="color:#f97316;">주요 뉴스</span></h1>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:36px;">한인 커뮤니티가 주목한<br>이번 주 뉴스 모음</p>
    <div style="color:#6b7280;font-size:20px;margin-bottom:32px;">스와이프 →</div>
    ${logo('#f97316')}
  </div></body></html>`,

  ...newsItems.map((n,i) => `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0d0d0d;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:70px 80px;">
    <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid ${n.color}44;padding:10px 28px;border-radius:40px;margin-bottom:32px;">
      <span style="color:${n.color};font-size:22px;font-weight:700;">${n.cat}</span>
    </div>
    <div style="font-size:80px;margin-bottom:28px;">${n.emoji}</div>
    <h2 style="font-size:52px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:28px;">${n.title}</h2>
    <p style="font-size:26px;color:#9ca3af;line-height:1.7;margin-bottom:36px;">${n.desc}</p>
    <div style="color:#6b7280;font-size:18px;margin-bottom:16px;">${i+1} / 4</div>
    ${logo('#f97316')}
  </div></body></html>`),

  // CTA
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0d0d0d;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:24px;">🌐</div>
    <h2 style="font-size:64px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:20px;">더 많은 뉴스는<br><span style="color:#f97316;">달커넥트</span>에서</h2>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:40px;">DFW · 미국 · 한국 · 세계<br>매일 업데이트</p>
    <div style="background:#f97316;padding:20px 48px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#fff;font-size:24px;font-weight:900;">dalkonnect.com/news</span>
    </div>
    ${logo('#f97316')}
  </div></body></html>`,
];

// ══════════════════════════════════════════════════════
// POST 3: K-차트 캐러셀
// ══════════════════════════════════════════════════════
const chartSlides = [
  // 커버
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:20px;">🎵</div>
    <div style="color:#a855f7;font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:16px;">WEEKLY CHART · 2026.03.15</div>
    <h1 style="font-size:88px;font-weight:900;color:#fff;line-height:1.0;margin-bottom:20px;">이번 주<br><span style="color:#a855f7;">K-컨텐츠</span><br>차트</h1>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:36px;">드라마 · 음악 · 영화 TOP 3</p>
    <div style="color:#6b7280;font-size:20px;margin-bottom:32px;">스와이프 →</div>
    ${logo('#a855f7')}
  </div></body></html>`,

  // 드라마
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(236,72,153,0.15);border:1px solid rgba(236,72,153,0.4);padding:10px 28px;border-radius:40px;">
        <span style="color:#ec4899;font-size:24px;font-weight:700;">🎬 드라마 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:18px;flex:1;">
      ${[['1','Boyfriend on Demand','Netflix','#ec4899'],['2','The Price of Goodbye','Netflix','#6b7280'],['3','Pursuit of Jade','Netflix','#6b7280']].map(([n,t,s,c])=>`
      <div style="background:rgba(255,255,255,0.05);border:1px solid ${n==='1'?'rgba(236,72,153,0.3)':'rgba(255,255,255,0.08)'};border-radius:20px;padding:26px 32px;display:flex;align-items:center;gap:22px;">
        <div style="font-size:52px;font-weight:900;color:${c};min-width:60px;text-align:center;">${n}</div>
        <div>
          <div style="color:#fff;font-size:28px;font-weight:800;">${t}</div>
          <div style="color:#9ca3af;font-size:20px;margin-top:4px;">${s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;text-align:center;">1 / 3</div>
  </div></body></html>`,

  // 뮤직
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);padding:10px 28px;border-radius:40px;">
        <span style="color:#a855f7;font-size:24px;font-weight:700;">🎵 뮤직 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:18px;flex:1;">
      ${[['1','BANG BANG','404 (New Era) · KiiiKiii','#a855f7'],['2','RUDE!','0+0','#6b7280'],['3','GO BLACKPINK','BLACKPINK','#6b7280']].map(([n,t,s,c])=>`
      <div style="background:rgba(255,255,255,0.05);border:1px solid ${n==='1'?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.08)'};border-radius:20px;padding:26px 32px;display:flex;align-items:center;gap:22px;">
        <div style="font-size:52px;font-weight:900;color:${c};min-width:60px;text-align:center;">${n}</div>
        <div>
          <div style="color:#fff;font-size:28px;font-weight:800;">${t}</div>
          <div style="color:#9ca3af;font-size:20px;margin-top:4px;">${s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;text-align:center;">2 / 3</div>
  </div></body></html>`,

  // 영화
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 70px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.4);padding:10px 28px;border-radius:40px;">
        <span style="color:#2ED8A3;font-size:24px;font-weight:700;">🎬 영화 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:18px;flex:1;">
      ${[['1','왕과 사는 남자','한국 박스오피스 · 55만명 돌파 🔥','#2ED8A3'],['2','War Machine','Netflix','#6b7280'],['3','K-foodie meets J-foodie','Netflix','#6b7280']].map(([n,t,s,c])=>`
      <div style="background:rgba(255,255,255,0.05);border:1px solid ${n==='1'?'rgba(46,216,163,0.3)':'rgba(255,255,255,0.08)'};border-radius:20px;padding:26px 32px;display:flex;align-items:center;gap:22px;">
        <div style="font-size:52px;font-weight:900;color:${c};min-width:60px;text-align:center;">${n}</div>
        <div>
          <div style="color:#fff;font-size:28px;font-weight:800;">${t}</div>
          <div style="color:#9ca3af;font-size:20px;margin-top:4px;">${s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#6b7280;font-size:18px;margin-top:8px;text-align:center;">3 / 3</div>
  </div></body></html>`,

  // CTA
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0e0718;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">
    <div style="font-size:72px;margin-bottom:24px;">🎬</div>
    <h2 style="font-size:64px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:20px;">전체 차트는<br><span style="color:#a855f7;">달커넥트</span>에서</h2>
    <p style="font-size:26px;color:#9ca3af;margin-bottom:40px;">드라마 · 뮤직 · 영화 · Netflix<br>매주 업데이트</p>
    <div style="background:linear-gradient(to right,#a855f7,#ec4899);padding:20px 48px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#fff;font-size:24px;font-weight:900;">dalkonnect.com/charts</span>
    </div>
    ${logo('#a855f7')}
  </div></body></html>`,
];

async function main() {
  const all = [
    ...churchSlides.map((h,i) => [h,`church-${String(i).padStart(2,'0')}.png`]),
    ...newsSlides.map((h,i) => [h,`news-${String(i).padStart(2,'0')}.png`]),
    ...chartSlides.map((h,i) => [h,`chart-${String(i).padStart(2,'0')}.png`]),
  ];
  for (const [html, name] of all) {
    await shot(html, name);
    process.stdout.write(`✅ ${name}  `);
  }
  console.log('\n완료!', OUT);
}
main().catch(console.error);
