/**
 * DalKonnect 인스타 슬라이드 카드 (캐러셀용)
 * 요즘 한국 인스타 트렌드: 미니멀 + 큰 타이포 + 파스텔/다크 + 여백
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'sns-cards', 'insta-slides');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 슬라이드 세트 1: "달라스 한인 생활 필수 앱" (10장)
const SLIDES = [
  // 1. 표지
  {
    name: 'slide-01-cover',
    html: `
    <div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#555;letter-spacing:2px;">1 / 10</div>
      <div style="font-size:18px;color:#e94560;letter-spacing:6px;margin-bottom:40px;">SAVE THIS 📌</div>
      <div style="font-size:68px;font-weight:900;line-height:1.2;text-align:center;margin-bottom:30px;">달라스 한인이<br/>꼭 알아야 할<br/>생활 정보 모음</div>
      <div style="width:60px;height:4px;background:#e94560;margin-bottom:30px;"></div>
      <div style="font-size:24px;color:#888;margin-bottom:60px;">← 슬라이드로 넘겨보세요</div>
      <div style="font-size:20px;color:#555;">@dalkonnect</div>
    </div>`
  },
  // 2. 한인 마트
  {
    name: 'slide-02-marts',
    html: `
    <div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#bbb;letter-spacing:2px;">2 / 10</div>
      <div style="font-size:18px;color:#e94560;letter-spacing:4px;margin-bottom:20px;">🛒 KOREAN MARTS</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:50px;line-height:1.2;">한인 마트<br/>어디가 좋아요?</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1;">
        ${[
          ['H Mart 캐럴턴', 'Old Denton Rd', '가장 크고 다양한 한국 식재료'],
          ['H Mart 플레이노', 'Legacy Dr', '깔끔하고 주차 편한'],
          ['99 Ranch Market', 'Old Denton Rd', '아시안 식재료 + 저렴'],
          ['Komart', 'Old Denton Rd', '한국 반찬/떡/생선 전문'],
          ['Zion Market', 'Royal Ln', '수산물 강추']
        ].map(([name, loc, desc]) => `
          <div style="background:white;padding:28px 35px;border-radius:16px;box-shadow:0 2px 15px rgba(0,0,0,0.04);">
            <div style="font-size:28px;font-weight:700;color:#222;margin-bottom:6px;">${name}</div>
            <div style="font-size:18px;color:#999;margin-bottom:4px;">📍 ${loc}</div>
            <div style="font-size:20px;color:#666;">${desc}</div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:18px;color:#bbb;text-align:center;margin-top:20px;">dalkonnect.com · @dalkonnect</div>
    </div>`
  },
  // 3. 맛집 추천
  {
    name: 'slide-03-food',
    html: `
    <div style="width:1080px;height:1350px;background:#1a1a2e;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#555;letter-spacing:2px;">3 / 10</div>
      <div style="font-size:18px;color:#ff6b35;letter-spacing:4px;margin-bottom:20px;">🍽️ MUST-EAT</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:50px;line-height:1.2;">현지인 추천<br/>한식당 BEST</div>
      <div style="display:flex;flex-direction:column;gap:18px;flex:1;">
        ${[
          ['🥩', '삼겹살', 'Gen Korean BBQ · Gangnam BBQ'],
          ['🍜', '국수/면', 'Kooksoo · 짬뽕지존'],
          ['🥘', '찌개/탕', '도마설렁탕 · 1인자감자탕'],
          ['🍗', '치킨', 'bb.q Chicken · KO! Chicken'],
          ['🥟', '분식', 'Oh K Dog · Tous Les Jours']
        ].map(([emoji, cat, places]) => `
          <div style="background:rgba(255,255,255,0.06);padding:28px 35px;border-radius:16px;display:flex;align-items:center;gap:25px;">
            <div style="font-size:48px;">${emoji}</div>
            <div>
              <div style="font-size:26px;font-weight:700;margin-bottom:6px;">${cat}</div>
              <div style="font-size:20px;color:#aaa;">${places}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:18px;color:#555;text-align:center;margin-top:20px;">전체 맛집 리스트 → dalkonnect.com</div>
    </div>`
  },
  // 4. 병원/의료
  {
    name: 'slide-04-medical',
    html: `
    <div style="width:1080px;height:1350px;background:linear-gradient(180deg,#e8f4f8 0%,#fff 100%);display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#bbb;letter-spacing:2px;">4 / 10</div>
      <div style="font-size:18px;color:#0077b6;letter-spacing:4px;margin-bottom:20px;">🏥 MEDICAL</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:20px;line-height:1.2;">한국어 되는<br/>병원 찾기</div>
      <div style="font-size:22px;color:#888;margin-bottom:50px;">영어 걱정 없이 진료받으세요</div>
      <div style="display:flex;flex-wrap:wrap;gap:18px;flex:1;">
        ${['🏥 내과', '🦷 치과', '👁️ 안과', '🧠 정신과', '🤰 산부인과', '🦴 정형외과', '💊 한의원', '🧒 소아과'].map(cat => `
          <div style="background:white;padding:24px 35px;border-radius:16px;font-size:26px;font-weight:600;color:#333;box-shadow:0 2px 15px rgba(0,0,0,0.05);width:calc(50% - 9px);text-align:center;">${cat}</div>
        `).join('')}
      </div>
      <div style="background:#0077b6;padding:20px;border-radius:16px;text-align:center;margin-top:30px;">
        <div style="font-size:24px;font-weight:600;color:white;">한국어 진료 가능한 병원만 모았습니다</div>
        <div style="font-size:18px;color:rgba(255,255,255,0.7);margin-top:8px;">dalkonnect.com → 업소록 → 의료</div>
      </div>
    </div>`
  },
  // 5. 생활 꿀팁
  {
    name: 'slide-05-tips',
    html: `
    <div style="width:1080px;height:1350px;background:#fff;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#bbb;letter-spacing:2px;">5 / 10</div>
      <div style="font-size:18px;color:#e94560;letter-spacing:4px;margin-bottom:20px;">💡 LIFE TIPS</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:50px;line-height:1.2;">달라스 생활<br/>꿀팁 모음</div>
      <div style="display:flex;flex-direction:column;gap:18px;flex:1;">
        ${[
          ['🚗', '운전면허', 'Texas DPS 예약 필수, 한국 면허 교환 가능'],
          ['🏫', '학군', 'Plano ISD · Frisco ISD 인기'],
          ['💰', '세금', '한인 세무사 Tax Season 2-4월'],
          ['📱', '통신', 'T-Mobile · Mint Mobile 인기'],
          ['🏠', '집 구하기', 'Zillow + 한인 부동산 에이전트']
        ].map(([emoji, title, desc]) => `
          <div style="display:flex;gap:25px;align-items:flex-start;padding:25px 0;border-bottom:1px solid #f0f0f0;">
            <div style="font-size:42px;min-width:55px;">${emoji}</div>
            <div>
              <div style="font-size:28px;font-weight:700;color:#222;margin-bottom:8px;">${title}</div>
              <div style="font-size:22px;color:#777;line-height:1.4;">${desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:18px;color:#bbb;text-align:center;">더 많은 가이드 → dalkonnect.com/blog</div>
    </div>`
  },
  // 6. 교회
  {
    name: 'slide-06-church',
    html: `
    <div style="width:1080px;height:1350px;background:linear-gradient(180deg,#2d1b69 0%,#11001c 100%);display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#555;letter-spacing:2px;">6 / 10</div>
      <div style="font-size:18px;color:#c9b1ff;letter-spacing:4px;margin-bottom:20px;">⛪ CHURCHES</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:20px;line-height:1.2;">DFW 한인교회<br/>한눈에</div>
      <div style="font-size:22px;color:#9b8ec4;margin-bottom:50px;">지역별 · 교단별 검색</div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
        ${[
          'Dallas 한인교회', 'Plano 한인장로교회', 'Carrollton 제일침례교회',
          'Richardson 한인감리교회', 'Frisco 새빛교회', 'Irving 한인교회'
        ].map(name => `
          <div style="background:rgba(255,255,255,0.08);padding:24px 30px;border-radius:14px;font-size:26px;backdrop-filter:blur(5px);">${name}</div>
        `).join('')}
      </div>
      <div style="text-align:center;">
        <div style="font-size:48px;font-weight:900;color:#c9b1ff;margin-bottom:10px;">50+</div>
        <div style="font-size:22px;color:#9b8ec4;">개 한인교회 등록</div>
      </div>
      <div style="font-size:16px;color:#555;text-align:center;margin-top:30px;">dalkonnect.com · @dalkonnect</div>
    </div>`
  },
  // 7. 사고팔기
  {
    name: 'slide-07-marketplace',
    html: `
    <div style="width:1080px;height:1350px;background:#f5fff5;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#bbb;letter-spacing:2px;">7 / 10</div>
      <div style="font-size:18px;color:#2d8f4e;letter-spacing:4px;margin-bottom:20px;">🛍️ MARKETPLACE</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:20px;line-height:1.2;">달라스 한인<br/>사고팔기</div>
      <div style="font-size:22px;color:#888;margin-bottom:50px;">당근마켓 같은 DFW 버전!</div>
      <div style="display:flex;flex-wrap:wrap;gap:18px;flex:1;align-content:flex-start;">
        ${['가구/인테리어', '전자제품', '유아/아동', '의류/잡화', '자동차', '부동산', '무료나눔', '구인/구직'].map(cat => `
          <div style="background:white;padding:22px 30px;border-radius:14px;font-size:24px;font-weight:600;color:#333;box-shadow:0 2px 12px rgba(0,0,0,0.05);width:calc(50% - 9px);text-align:center;">
            ${cat}
          </div>
        `).join('')}
      </div>
      <div style="background:#2d8f4e;padding:22px 40px;border-radius:16px;text-align:center;margin-top:20px;">
        <div style="font-size:26px;font-weight:700;color:white;">무료로 올리기 →</div>
        <div style="font-size:18px;color:rgba(255,255,255,0.7);margin-top:5px;">dalkonnect.com/marketplace/new</div>
      </div>
    </div>`
  },
  // 8. K-POP 차트
  {
    name: 'slide-08-charts',
    html: `
    <div style="width:1080px;height:1350px;background:linear-gradient(135deg,#ff0844 0%,#ffb199 100%);display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:rgba(255,255,255,0.5);letter-spacing:2px;">8 / 10</div>
      <div style="font-size:18px;letter-spacing:4px;margin-bottom:20px;opacity:0.8;">🎵 CHARTS</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:20px;line-height:1.2;">K-POP · 드라마<br/>넷플릭스 · 영화</div>
      <div style="font-size:22px;opacity:0.7;margin-bottom:50px;">실시간 차트 업데이트</div>
      <div style="display:flex;flex-direction:column;gap:15px;flex:1;">
        ${[
          ['🥇', '음악', 'K-POP · YouTube Music 차트'],
          ['🎬', '영화', 'KOBIS 박스오피스'],
          ['📺', '드라마', '인기 한국 드라마 순위'],
          ['🍿', '넷플릭스', 'Netflix Korea TOP 10']
        ].map(([emoji, cat, desc]) => `
          <div style="background:rgba(255,255,255,0.2);padding:28px 30px;border-radius:16px;display:flex;align-items:center;gap:20px;backdrop-filter:blur(5px);">
            <div style="font-size:40px;">${emoji}</div>
            <div>
              <div style="font-size:28px;font-weight:700;">${cat}</div>
              <div style="font-size:20px;opacity:0.8;">${desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="font-size:18px;opacity:0.5;text-align:center;">매일 자동 업데이트 · dalkonnect.com/charts</div>
    </div>`
  },
  // 9. 뉴스
  {
    name: 'slide-09-news',
    html: `
    <div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:16px;color:#555;letter-spacing:2px;">9 / 10</div>
      <div style="font-size:18px;color:#00b4d8;letter-spacing:4px;margin-bottom:20px;">📰 NEWS</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:20px;line-height:1.2;">DFW 한인 뉴스<br/>매일 자동 업데이트</div>
      <div style="font-size:22px;color:#666;margin-bottom:50px;">하루 3번 · 한글로</div>
      <div style="display:flex;flex-direction:column;gap:14px;flex:1;">
        ${[
          '🇰🇷 한국 뉴스 (연합·한겨레·동아·조선)',
          '🇺🇸 미국 뉴스 → 한글 번역',
          '📍 DFW 로컬 뉴스',
          '🌏 월드 뉴스',
          '✈️ 이민/비자 뉴스',
          '💰 세금/재정 정보'
        ].map(item => `
          <div style="padding:22px 30px;border-left:3px solid #00b4d8;font-size:24px;color:#ccc;">${item}</div>
        `).join('')}
      </div>
      <div style="font-size:18px;color:#555;text-align:center;">dalkonnect.com/news</div>
    </div>`
  },
  // 10. CTA (마지막)
  {
    name: 'slide-10-cta',
    html: `
    <div style="width:1080px;height:1350px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;">
      <div style="font-size:18px;color:#e94560;letter-spacing:6px;margin-bottom:40px;">10 / 10</div>
      <div style="font-size:64px;font-weight:900;text-align:center;line-height:1.2;margin-bottom:30px;">달라스 한인의<br/>모든 것,<br/>한곳에서.</div>
      <div style="width:60px;height:4px;background:#e94560;margin-bottom:40px;"></div>
      <div style="font-size:28px;color:#a8b8d8;margin-bottom:60px;text-align:center;">업소록 · 뉴스 · 커뮤니티 · 마켓<br/>블로그 · 차트 · 딜</div>
      <div style="background:#e94560;padding:22px 60px;border-radius:50px;font-size:32px;font-weight:700;margin-bottom:20px;">dalkonnect.com</div>
      <div style="font-size:22px;color:#5a6a8a;margin-bottom:50px;">@dalkonnect</div>
      <div style="font-size:20px;color:#444;">📌 저장하고 필요할 때 찾아보세요!</div>
    </div>`
  }
];

async function generate() {
  console.log('🎨 인스타 슬라이드 생성 시작 (10장)...\n');
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (const slide of SLIDES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>*{margin:0;padding:0;box-sizing:border-box;}</style>
      </head><body>${slide.html}</body></html>`;
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const filePath = path.join(OUTPUT_DIR, `${slide.name}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    console.log('✅ ' + slide.name + '.png');
    await page.close();
  }
  
  await browser.close();
  console.log('\n🎉 완료! 10장 슬라이드 → ' + OUTPUT_DIR);
}

generate().catch(console.error);
