/**
 * DalKonnect Sunday Carousel v4 — 클릭 유도 최적화
 * 훅: 궁금증 유발 + FOMO + 스와이프 유도
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'sns-cards', 'carousel-v4');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function shot(html, filename) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));
  const out = path.join(OUT, filename);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  return out;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}`;
const logo = (c='#2ED8A3') => `<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><div style="width:9px;height:9px;background:${c};border-radius:50%;"></div><span style="font-size:22px;font-weight:800;color:#fff;">DalKonnect</span></div>`;

// ══════════════════════════════════════════════════════
// 교회 찾기 — "달라스에 이런 교회가 있었어?"
// ══════════════════════════════════════════════════════
const church = [

  // 커버: 궁금증 훅
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#060e1a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(46,216,163,0.12) 0%,transparent 65%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 70px;position:relative;">
    <div style="background:rgba(46,216,163,0.15);border:1px solid rgba(46,216,163,0.5);padding:10px 28px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#2ED8A3;font-size:20px;font-weight:700;letter-spacing:2px;">⛪ 달라스 한인교회</span>
    </div>
    <h1 style="font-size:82px;font-weight:900;color:#fff;line-height:1.15;margin-bottom:24px;">
      DFW에<br><span style="color:#2ED8A3;">구글 5.0⭐</span><br>교회가 있다?
    </h1>
    <p style="font-size:28px;color:#9ca3af;line-height:1.6;margin-bottom:40px;">달라스 한인 교인 리뷰 기반<br>지역별 TOP 교회 정리</p>
    <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);padding:16px 32px;border-radius:50px;">
      <span style="color:#fff;font-size:22px;font-weight:700;">스와이프해서 확인하세요</span>
      <span style="font-size:28px;">👉</span>
    </div>
    <div style="position:absolute;bottom:36px;">${logo()}</div>
  </div></body></html>`,

  // 슬라이드 1: "먼저 달라스·어빙부터" — 만점 교회 강조
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#060e1a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:48px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(46,216,163,0.12);border:1px solid rgba(46,216,163,0.35);padding:10px 26px;border-radius:50px;">
        <span style="font-size:22px;">📍</span>
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">달라스 · 어빙</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        {rank:'1',name:'DALLAS WOORI REFORMED',sub:'Irving · 5.0⭐ 만점 · 60 리뷰',hot:true,badge:'🏆 만점'},
        {rank:'2',name:'달라스 중앙감리교회',sub:'Irving · 4.8⭐ · 100 리뷰',hot:false,badge:''},
        {rank:'3',name:'The Life Church - Dallas',sub:'Dallas · 4.7⭐ · 104 리뷰',hot:false,badge:''},
        {rank:'4',name:'St. Andrew Kim 성당',sub:'Irving · 4.8⭐ · 96 리뷰',hot:false,badge:''},
      ].map(r=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${r.hot?'rgba(46,216,163,0.45)':'rgba(255,255,255,0.09)'};border-radius:16px;padding:20px 26px;display:flex;align-items:center;gap:18px;${r.hot?'box-shadow:0 0 20px rgba(46,216,163,0.1);':''}">
        <div style="width:48px;height:48px;background:${r.hot?'#2ED8A3':'rgba(255,255,255,0.08)'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${r.hot?'#060e1a':'#6b7280'};flex-shrink:0;">${r.rank}</div>
        <div style="flex:1;">
          <div style="color:#fff;font-size:22px;font-weight:800;line-height:1.2;">${r.name}${r.badge?` <span style="color:#2ED8A3;font-size:17px;">${r.badge}</span>`:''}</div>
          <div style="color:#9ca3af;font-size:17px;margin-top:3px;">${r.sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo()}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">1 / 3 지역 · 다음 👉 캐럴턴</div>
  </div></body></html>`,

  // 슬라이드 2: 캐럴턴 — 리뷰 가장 많은 교회 강조
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#060e1a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:48px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(46,216,163,0.12);border:1px solid rgba(46,216,163,0.35);padding:10px 26px;border-radius:50px;">
        <span style="font-size:22px;">📍</span>
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">캐럴턴 · 리차드슨</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        {rank:'1',name:'Semihan Church',sub:'Carrollton · 4.7⭐ · 리뷰 157개 최다',hot:true,badge:'💬 리뷰 최다'},
        {rank:'2',name:'뉴송교회',sub:'Carrollton · 4.7⭐ · 97 리뷰',hot:false,badge:''},
        {rank:'3',name:'빛내리 교회',sub:'Richardson · 4.8⭐ · 54 리뷰',hot:false,badge:''},
        {rank:'4',name:'Hanuri Church',sub:'Carrollton · 4.8⭐ · 43 리뷰',hot:false,badge:''},
      ].map(r=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${r.hot?'rgba(46,216,163,0.45)':'rgba(255,255,255,0.09)'};border-radius:16px;padding:20px 26px;display:flex;align-items:center;gap:18px;${r.hot?'box-shadow:0 0 20px rgba(46,216,163,0.1);':''}">
        <div style="width:48px;height:48px;background:${r.hot?'#2ED8A3':'rgba(255,255,255,0.08)'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${r.hot?'#060e1a':'#6b7280'};flex-shrink:0;">${r.rank}</div>
        <div style="flex:1;">
          <div style="color:#fff;font-size:22px;font-weight:800;line-height:1.2;">${r.name}${r.badge?` <span style="color:#2ED8A3;font-size:17px;">${r.badge}</span>`:''}</div>
          <div style="color:#9ca3af;font-size:17px;margin-top:3px;">${r.sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo()}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">2 / 3 지역 · 다음 👉 플라노</div>
  </div></body></html>`,

  // 슬라이드 3: 플라노/프리스코
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#060e1a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:48px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(46,216,163,0.12);border:1px solid rgba(46,216,163,0.35);padding:10px 26px;border-radius:50px;">
        <span style="font-size:22px;">📍</span>
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">플라노 · 프리스코 · 루이스빌</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;flex:1;">
      ${[
        {rank:'1',name:'Semihan Church North Campus',sub:'Frisco · 5.0⭐ 만점 · 38 리뷰',hot:true,badge:'🏆 만점'},
        {rank:'2',name:'영락 장로 교회',sub:'Plano · 4.6⭐ · 73 리뷰',hot:false,badge:''},
        {rank:'3',name:'예닮교회',sub:'Lewisville · 5.0⭐ · 19 리뷰',hot:false,badge:''},
        {rank:'4',name:'플라워마운드교회',sub:'Flower Mound · 4.6⭐ · 30 리뷰',hot:false,badge:''},
      ].map(r=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${r.hot?'rgba(46,216,163,0.45)':'rgba(255,255,255,0.09)'};border-radius:16px;padding:20px 26px;display:flex;align-items:center;gap:18px;${r.hot?'box-shadow:0 0 20px rgba(46,216,163,0.1);':''}">
        <div style="width:48px;height:48px;background:${r.hot?'#2ED8A3':'rgba(255,255,255,0.08)'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${r.hot?'#060e1a':'#6b7280'};flex-shrink:0;">${r.rank}</div>
        <div style="flex:1;">
          <div style="color:#fff;font-size:22px;font-weight:800;line-height:1.2;">${r.name}${r.badge?` <span style="color:#2ED8A3;font-size:17px;">${r.badge}</span>`:''}</div>
          <div style="color:#9ca3af;font-size:17px;margin-top:3px;">${r.sub}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo()}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">3 / 3 지역 · 마지막 슬라이드 👉</div>
  </div></body></html>`,

  // CTA: 저장 유도
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#060e1a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#2ED8A3,#3b82f6);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(46,216,163,0.08),transparent 65%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative;">
    <div style="font-size:64px;margin-bottom:24px;">🔖</div>
    <h2 style="font-size:58px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:16px;">나중에 찾을 때<br><span style="color:#2ED8A3;">저장해두세요</span></h2>
    <p style="font-size:24px;color:#9ca3af;margin-bottom:36px;">달커넥트에서 교회 주소, 전화번호,<br>리뷰까지 한번에 확인</p>
    <div style="background:#2ED8A3;padding:18px 44px;border-radius:50px;margin-bottom:14px;">
      <span style="color:#060e1a;font-size:23px;font-weight:900;">dalkonnect.com/businesses</span>
    </div>
    <p style="color:#6b7280;font-size:19px;margin-bottom:36px;">카테고리 → 교회 필터</p>
    ${logo()}
  </div></body></html>`,
];

// ══════════════════════════════════════════════════════
// 뉴스 — "이번 주 이 뉴스 놓치셨나요?"
// ══════════════════════════════════════════════════════
const news = [

  // 커버: "4가지만 알면 됩니다" 훅
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0a0a0a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(239,68,68,0.1),transparent 60%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 70px;position:relative;">
    <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.5);padding:10px 28px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#ef4444;font-size:20px;font-weight:700;letter-spacing:2px;">📰 이번 주 핵심 뉴스</span>
    </div>
    <h1 style="font-size:76px;font-weight:900;color:#fff;line-height:1.15;margin-bottom:24px;">
      이번 주<br><span style="color:#f97316;">놓치면 안 될</span><br>뉴스 4가지
    </h1>
    <p style="font-size:26px;color:#9ca3af;line-height:1.6;margin-bottom:40px;">북한 · 트럼프 · 이란 · DFW<br>한인 커뮤니티가 주목한 소식</p>
    <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);padding:16px 32px;border-radius:50px;">
      <span style="color:#fff;font-size:22px;font-weight:700;">스와이프해서 확인하세요</span>
      <span style="font-size:28px;">👉</span>
    </div>
    <div style="position:absolute;bottom:36px;">${logo('#f97316')}</div>
  </div></body></html>`,

  ...([
    {n:'1',emoji:'🕵️',cat:'국제',color:'#a855f7',title:'북한 공작원들, AI로 유럽 위장취업',hook:'진짜 AI가 이렇게도 쓰인다고?',desc:'북한이 인공지능으로 신분을 위장해 유럽 대기업 IT 직책에 취업, 임금을 외화로 빼돌리는 사건이 드러났습니다.'},
    {n:'2',emoji:'🇺🇸',cat:'미국',color:'#ef4444',title:'트럼프, 방송사에 면허 취소 협박',hook:'언론 자유 어디까지?',desc:'이란전 보도에 격분한 트럼프 대통령이 미당국을 통해 방송사 문을 닫겠다고 공개 압박했습니다.'},
    {n:'3',emoji:'⚡',cat:'세계',color:'#f97316',title:'이란, 걸프 국가에 미사일 위협',hook:'중동 긴장 다시 고조',desc:'이란이 미군의 공격 시 UAE·바레인 미군기지를 "합법적 표적"으로 선언하며 걸프 전역에 경고를 보냈습니다.'},
    {n:'4',emoji:'💚',cat:'DFW 소식',color:'#2ED8A3',title:'달라스 십대 암 생존자의 따뜻한 소원',hook:'눈물 주의 🥺',desc:'암을 이겨낸 달라스의 한 십대가 메이크어위시 소원을 자신이 아닌 지역사회 봉사로 채워 화제가 됐습니다.'},
  ].map(item=>`<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0a0a0a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:65px 80px;position:relative;">
    <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.07);border:1px solid ${item.color}55;padding:10px 26px;border-radius:50px;margin-bottom:28px;">
      <span style="color:${item.color};font-size:20px;font-weight:700;">${item.cat}</span>
      <span style="color:#4b5563;font-size:18px;">${item.n} / 4</span>
    </div>
    <div style="font-size:72px;margin-bottom:20px;">${item.emoji}</div>
    <div style="color:${item.color};font-size:26px;font-weight:700;margin-bottom:12px;">"${item.hook}"</div>
    <h2 style="font-size:50px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:24px;">${item.title}</h2>
    <p style="font-size:24px;color:#9ca3af;line-height:1.75;margin-bottom:32px;">${item.desc}</p>
    <div style="color:#4b5563;font-size:18px;">${parseInt(item.n)<4?'다음 뉴스 👉':'전체 뉴스 보러 가기 👉'}</div>
    <div style="position:absolute;bottom:30px;">${logo('#f97316')}</div>
  </div></body></html>`)),

  // CTA
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0a0a0a;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#ef4444,#f97316);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(249,115,22,0.08),transparent 60%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative;">
    <div style="font-size:64px;margin-bottom:24px;">🌐</div>
    <h2 style="font-size:58px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:16px;">매일 업데이트되는<br><span style="color:#f97316;">한인 뉴스</span> 한곳에</h2>
    <p style="font-size:24px;color:#9ca3af;margin-bottom:36px;">DFW · 미국 · 한국 · 세계 뉴스<br>달커넥트에서 매일 확인하세요</p>
    <div style="background:#f97316;padding:18px 44px;border-radius:50px;margin-bottom:36px;">
      <span style="color:#fff;font-size:23px;font-weight:900;">dalkonnect.com/news</span>
    </div>
    ${logo('#f97316')}
  </div></body></html>`,
];

// ══════════════════════════════════════════════════════
// K-차트 — "이번 주 1위가 이거라고?"
// ══════════════════════════════════════════════════════
const chart = [

  // 커버: 궁금증 훅
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0c0618;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(168,85,247,0.12),transparent 60%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 70px;position:relative;">
    <div style="background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.5);padding:10px 28px;border-radius:50px;margin-bottom:32px;">
      <span style="color:#a855f7;font-size:20px;font-weight:700;letter-spacing:2px;">🎵 이번 주 K-컨텐츠</span>
    </div>
    <h1 style="font-size:76px;font-weight:900;color:#fff;line-height:1.15;margin-bottom:24px;">
      이번 주<br><span style="color:#a855f7;">드라마 1위</span>가<br>이거라고?
    </h1>
    <p style="font-size:26px;color:#9ca3af;line-height:1.6;margin-bottom:40px;">드라마 · 음악 · 영화<br>이번 주 K-컨텐츠 순위 공개</p>
    <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);padding:16px 32px;border-radius:50px;">
      <span style="color:#fff;font-size:22px;font-weight:700;">스와이프해서 확인하세요</span>
      <span style="font-size:28px;">👉</span>
    </div>
    <div style="position:absolute;bottom:36px;">${logo('#a855f7')}</div>
  </div></body></html>`,

  // 드라마
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0c0618;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;gap:10px;background:rgba(236,72,153,0.12);border:1px solid rgba(236,72,153,0.35);padding:10px 26px;border-radius:50px;">
        <span style="color:#ec4899;font-size:22px;font-weight:700;">🎬 드라마 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:16px;flex:1;">
      ${[
        {r:'1',t:'Boyfriend on Demand',s:'Netflix 이번 주 1위',c:'#ec4899',hot:true},
        {r:'2',t:'The Price of Goodbye',s:'Netflix',c:'#6b7280',hot:false},
        {r:'3',t:'Pursuit of Jade',s:'Netflix',c:'#6b7280',hot:false},
      ].map(x=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${x.hot?'rgba(236,72,153,0.45)':'rgba(255,255,255,0.09)'};border-radius:18px;padding:24px 30px;display:flex;align-items:center;gap:20px;${x.hot?'box-shadow:0 0 24px rgba(236,72,153,0.1);':''}">
        <div style="font-size:48px;font-weight:900;color:${x.c};min-width:60px;text-align:center;">${x.r}</div>
        <div>
          <div style="color:#fff;font-size:26px;font-weight:800;">${x.t}${x.hot?' 🔥':''}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:4px;">${x.s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">1 / 3 · 다음 👉 뮤직</div>
  </div></body></html>`,

  // 뮤직
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0c0618;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;gap:10px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.35);padding:10px 26px;border-radius:50px;">
        <span style="color:#a855f7;font-size:22px;font-weight:700;">🎵 뮤직 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:16px;flex:1;">
      ${[
        {r:'1',t:'BANG BANG',s:'404 (New Era) × KiiiKiii',c:'#a855f7',hot:true},
        {r:'2',t:'RUDE!',s:'0+0',c:'#6b7280',hot:false},
        {r:'3',t:'GO BLACKPINK',s:'BLACKPINK · YouTube 1위',c:'#6b7280',hot:false},
      ].map(x=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${x.hot?'rgba(168,85,247,0.45)':'rgba(255,255,255,0.09)'};border-radius:18px;padding:24px 30px;display:flex;align-items:center;gap:20px;${x.hot?'box-shadow:0 0 24px rgba(168,85,247,0.1);':''}">
        <div style="font-size:48px;font-weight:900;color:${x.c};min-width:60px;text-align:center;">${x.r}</div>
        <div>
          <div style="color:#fff;font-size:26px;font-weight:800;">${x.t}${x.hot?' 🔥':''}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:4px;">${x.s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">2 / 3 · 다음 👉 영화</div>
  </div></body></html>`,

  // 영화
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0c0618;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 68px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;gap:10px;background:rgba(46,216,163,0.12);border:1px solid rgba(46,216,163,0.35);padding:10px 26px;border-radius:50px;">
        <span style="color:#2ED8A3;font-size:22px;font-weight:700;">🎬 영화 TOP 3</span>
      </div>
    </div>
    <div style="width:100%;display:flex;flex-direction:column;gap:16px;flex:1;">
      ${[
        {r:'1',t:'왕과 사는 남자',s:'한국 박스오피스 · 55만명 돌파 🔥',c:'#2ED8A3',hot:true},
        {r:'2',t:'War Machine',s:'Netflix',c:'#6b7280',hot:false},
        {r:'3',t:'K-foodie meets J-foodie',s:'Netflix · 한일 푸드 콜라보',c:'#6b7280',hot:false},
      ].map(x=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid ${x.hot?'rgba(46,216,163,0.45)':'rgba(255,255,255,0.09)'};border-radius:18px;padding:24px 30px;display:flex;align-items:center;gap:20px;${x.hot?'box-shadow:0 0 24px rgba(46,216,163,0.1);':''}">
        <div style="font-size:48px;font-weight:900;color:${x.c};min-width:60px;text-align:center;">${x.r}</div>
        <div>
          <div style="color:#fff;font-size:26px;font-weight:800;">${x.t}</div>
          <div style="color:#9ca3af;font-size:18px;margin-top:4px;">${x.s}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="margin-top:18px;text-align:center;">${logo('#a855f7')}</div>
    <div style="color:#4b5563;font-size:17px;margin-top:6px;text-align:center;">3 / 3 · 마지막 슬라이드 👉</div>
  </div></body></html>`,

  // CTA
  `<html><head>${FONTS}<style>${BASE}</style></head>
  <body style="width:1080px;height:1080px;background:#0c0618;font-family:'Noto Sans KR',sans-serif;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#a855f7,#ec4899);"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(168,85,247,0.08),transparent 60%);"></div>
  <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative;">
    <div style="font-size:64px;margin-bottom:24px;">📊</div>
    <h2 style="font-size:58px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:16px;">전체 K-컨텐츠 차트<br><span style="color:#a855f7;">매주 업데이트</span></h2>
    <p style="font-size:24px;color:#9ca3af;margin-bottom:36px;">넷플릭스 · 유튜브 · 박스오피스<br>한번에 확인하세요</p>
    <div style="background:linear-gradient(to right,#a855f7,#ec4899);padding:18px 44px;border-radius:50px;margin-bottom:36px;">
      <span style="color:#fff;font-size:23px;font-weight:900;">dalkonnect.com/charts</span>
    </div>
    ${logo('#a855f7')}
  </div></body></html>`,
];

async function main() {
  const all = [
    ...church.map((h,i)=>[h,`church-${String(i).padStart(2,'0')}.png`]),
    ...news.map((h,i)=>[h,`news-${String(i).padStart(2,'0')}.png`]),
    ...chart.map((h,i)=>[h,`chart-${String(i).padStart(2,'0')}.png`]),
  ];
  for (const [html,name] of all) {
    await shot(html,name);
    process.stdout.write(`✅ ${name}  `);
  }
  console.log('\n완료!',OUT);
}
main().catch(console.error);
