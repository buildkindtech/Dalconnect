/**
 * DalKonnect 3월 생활정보 캐러셀 (3세트 × 5장)
 * POST 1: 세금신고 가이드
 * POST 2: 봄 이사 준비
 * POST 3: 달라스 필수 앱
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..', 'sns-cards', 'march-life');

const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">`;
const BASE_STYLE = `<style>*{margin:0;padding:0;box-sizing:border-box;}</style>`;

function wrapHtml(bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${FONT_LINK}${BASE_STYLE}</head><body>${bodyHtml}</body></html>`;
}

// ─────────────────────────────────────────────
// POST 1: 세금신고 (5 슬라이드)
// ─────────────────────────────────────────────
const POST1 = {
  dir: 'post1-tax',
  slides: [
    // slide-01: 표지 (COVER)
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">1 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:18px;color:#555;">@dalkonnect</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:6px;margin-bottom:36px;font-weight:700;">SAVE THIS 📌</div>
      <div style="width:80px;height:5px;background:#e94560;margin-bottom:40px;"></div>
      <div style="font-size:72px;font-weight:900;line-height:1.15;text-align:center;margin-bottom:28px;">미국 세금신고<br/>이것만 알면<br/>끝! ✅</div>
      <div style="font-size:26px;color:#888;margin-bottom:12px;text-align:center;">한인 초보를 위한 완벽 가이드</div>
      <div style="font-size:22px;color:#e94560;font-weight:600;">← 슬라이드 넘겨보세요</div>
    </div>`,

    // slide-02: 마감일
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">2 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#ccc;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">📅 DEADLINES</div>
      <div style="font-size:56px;font-weight:900;color:#222;margin-bottom:14px;line-height:1.15;">세금신고<br/>마감일 정리</div>
      <div style="font-size:22px;color:#999;margin-bottom:50px;">이 날짜는 꼭 외우세요!</div>
      <div style="display:flex;flex-direction:column;gap:22px;flex:1;">
        <div style="background:white;border-left:6px solid #e94560;padding:30px 36px;border-radius:0 16px 16px 0;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <div style="font-size:34px;font-weight:900;color:#e94560;margin-bottom:8px;">April 15, 2025</div>
          <div style="font-size:26px;font-weight:700;color:#222;margin-bottom:6px;">일반 신고 마감일</div>
          <div style="font-size:20px;color:#888;">Federal + State 세금신고 동시 마감</div>
        </div>
        <div style="background:white;border-left:6px solid #f4a261;padding:30px 36px;border-radius:0 16px 16px 0;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <div style="font-size:34px;font-weight:900;color:#f4a261;margin-bottom:8px;">October 15, 2025</div>
          <div style="font-size:26px;font-weight:700;color:#222;margin-bottom:6px;">연장 신청 마감일</div>
          <div style="font-size:20px;color:#888;">Form 4868 제출 시 6개월 자동 연장</div>
        </div>
        <div style="background:white;border-left:6px solid #2d8f4e;padding:30px 36px;border-radius:0 16px 16px 0;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <div style="font-size:26px;font-weight:700;color:#222;margin-bottom:8px;">⚠️ 주의 — 연장 ≠ 납부 연장</div>
          <div style="font-size:20px;color:#888;line-height:1.5;">신고 기간만 늘어나는 것, 납부는<br/>4월 15일까지 해야 페널티 없음</div>
        </div>
        <div style="background:#e94560;padding:24px 36px;border-radius:16px;text-align:center;">
          <div style="font-size:26px;font-weight:700;color:white;">지금 당장 캘린더에 추가하세요 📲</div>
        </div>
      </div>
    </div>`,

    // slide-03: 필수서류
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">3 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#444;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">📄 DOCUMENTS</div>
      <div style="font-size:56px;font-weight:900;margin-bottom:14px;line-height:1.15;">세무사에게<br/>가져갈 서류</div>
      <div style="font-size:22px;color:#666;margin-bottom:44px;">이 서류만 챙기면 OK</div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
        ${[
          ['W-2', '직장인 연봉/세금 보고서 (고용주 발행)', '#e94560'],
          ['1099', '프리랜서/부업/이자소득 신고서', '#f4a261'],
          ['SSN / ITIN', '사회보장번호 또는 개인납세자번호', '#4cc9f0'],
          ['1095-A', '오바마케어 가입자 건강보험 서류', '#7bed9f'],
          ['부양가족 SSN', '자녀/배우자 SSN 전원', '#c9b1ff'],
          ['작년 세금보고서', '이전 신고 기록 (세무사 요청 시)', '#aaa'],
        ].map(([title, desc, color]) => `
          <div style="display:flex;gap:20px;align-items:center;padding:18px 24px;background:rgba(255,255,255,0.06);border-radius:14px;">
            <div style="font-size:20px;font-weight:900;color:${color};min-width:110px;background:rgba(255,255,255,0.07);padding:10px 0;text-align:center;border-radius:8px;">${title}</div>
            <div style="font-size:22px;color:#ccc;line-height:1.4;">${desc}</div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-04: 달라스 한인 세무사
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">4 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#ccc;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">🧾 KOREAN CPAs IN DALLAS</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:14px;line-height:1.2;">달라스 한인<br/>세무사 정보</div>
      <div style="font-size:22px;color:#999;margin-bottom:44px;">한국어로 편하게 상담받으세요</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1;">
        ${[
          ['Kim & Associates CPA', 'Carrollton', '개인·법인 세금신고, 20년 경력'],
          ['박영수 세무회계', 'Plano', '한인 스몰비즈니스 전문'],
          ['DFW Korean Tax Group', 'Irving / Richardson', 'IRS 감사 대응, 이민자 세금 특화'],
          ['한미세무법인', 'Dallas', '법인설립 + 세금신고 패키지'],
        ].map(([name, loc, desc]) => `
          <div style="background:white;padding:28px 32px;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.05);">
            <div style="font-size:28px;font-weight:800;color:#222;margin-bottom:6px;">${name}</div>
            <div style="font-size:18px;color:#e94560;margin-bottom:8px;">📍 ${loc}</div>
            <div style="font-size:20px;color:#888;">${desc}</div>
          </div>
        `).join('')}
        <div style="background:#fff3cd;padding:20px 28px;border-radius:12px;font-size:20px;color:#856404;line-height:1.5;">
          💡 Tax Season (2-4월) 예약 필수! 빨리 잡을수록 좋아요.
        </div>
      </div>
    </div>`,

    // slide-05: CTA
    `<div style="width:1080px;height:1350px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">5 / 5</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:5px;margin-bottom:40px;font-weight:700;">마치며 ✅</div>
      <div style="font-size:62px;font-weight:900;text-align:center;line-height:1.2;margin-bottom:28px;">세금신고,<br/>이제 겁내지<br/>마세요 💪</div>
      <div style="width:60px;height:4px;background:#e94560;margin-bottom:36px;"></div>
      <div style="font-size:24px;color:#a8b8d8;text-align:center;margin-bottom:56px;line-height:1.6;">달라스 한인 세무사 목록 전체보기<br/>→ <span style="color:white;font-weight:700;">dalkonnect.com</span></div>
      <div style="background:#e94560;padding:22px 64px;border-radius:50px;font-size:32px;font-weight:800;margin-bottom:28px;">dalkonnect.com</div>
      <div style="font-size:22px;color:#5a6a8a;margin-bottom:48px;">@dalkonnect</div>
      <div style="font-size:20px;color:#444;text-align:center;">📌 저장 & 공유해서 주변 분들께도 알려주세요!</div>
    </div>`,
  ]
};

// ─────────────────────────────────────────────
// POST 2: 봄 이사 준비 (5 슬라이드)
// ─────────────────────────────────────────────
const POST2 = {
  dir: 'post2-moving',
  slides: [
    // slide-01: 표지
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">1 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:18px;color:#ccc;">@dalkonnect</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:6px;margin-bottom:36px;font-weight:700;">SAVE THIS 📌</div>
      <div style="width:80px;height:5px;background:#e94560;margin-bottom:40px;"></div>
      <div style="font-size:72px;font-weight:900;line-height:1.15;text-align:center;color:#222;margin-bottom:28px;">봄 이사 준비<br/>완벽 체크리스트<br/>🏡 🚚</div>
      <div style="font-size:26px;color:#888;margin-bottom:12px;text-align:center;">달라스 이사 전 꼭 봐야 할 가이드</div>
      <div style="font-size:22px;color:#e94560;font-weight:600;">← 슬라이드 넘겨보세요</div>
    </div>`,

    // slide-02: 이사 전 체크리스트
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">2 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#444;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">✅ CHECKLIST</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:14px;line-height:1.2;">이사 전<br/>할 일 리스트</div>
      <div style="font-size:22px;color:#666;margin-bottom:40px;">이사 4주 전부터 시작하세요</div>
      <div style="display:flex;flex-direction:column;gap:14px;flex:1;">
        ${[
          ['4주 전', '이사업체 3곳 이상 견적 비교', '#e94560'],
          ['3주 전', '주소변경: USPS, 은행, 직장, IRS', '#f4a261'],
          ['2주 전', '전기/가스/인터넷 이전 신청', '#4cc9f0'],
          ['1주 전', '포장재 준비 · 귀중품 직접 운반 계획', '#7bed9f'],
          ['이사 당일', '업체 보험 확인 · 재고 목록 작성', '#c9b1ff'],
          ['이사 후', '운전면허 주소변경 (30일 이내)', '#aaa'],
        ].map(([timing, task, color]) => `
          <div style="display:flex;gap:18px;align-items:center;padding:18px 22px;background:rgba(255,255,255,0.05);border-radius:12px;">
            <div style="font-size:16px;font-weight:800;color:${color};min-width:80px;text-align:center;background:rgba(255,255,255,0.07);padding:8px;border-radius:8px;">${timing}</div>
            <div style="font-size:22px;color:#ccc;">${task}</div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-03: 달라스 이사 비용 가이드
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">3 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#ccc;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">💰 MOVING COSTS</div>
      <div style="font-size:52px;font-weight:900;color:#222;margin-bottom:14px;line-height:1.2;">달라스 이사 비용<br/>얼마나 들까요?</div>
      <div style="font-size:22px;color:#999;margin-bottom:44px;">2025년 평균 시세 기준</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1;">
        ${[
          ['스튜디오 / 1BR', '$300 – $600', '2-3인 팀 · 2-4시간'],
          ['2BR 아파트', '$500 – $900', '3-4인 팀 · 3-5시간'],
          ['3BR 주택', '$800 – $1,500', '4인 팀 · 5-8시간'],
          ['장거리 (타주)', '$2,000 – $5,000+', '거리/무게 따라 상이'],
        ].map(([size, cost, note]) => `
          <div style="background:white;padding:28px 34px;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:26px;font-weight:700;color:#222;margin-bottom:6px;">${size}</div>
              <div style="font-size:18px;color:#999;">${note}</div>
            </div>
            <div style="font-size:30px;font-weight:900;color:#e94560;text-align:right;">${cost}</div>
          </div>
        `).join('')}
        <div style="background:#e8f5e9;padding:20px 28px;border-radius:12px;font-size:20px;color:#2d8f4e;line-height:1.5;">
          💡 팁: 주중 이사 & 월초/말 피하면 20-30% 저렴!
        </div>
      </div>
    </div>`,

    // slide-04: 이사업체 주의사항
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">4 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#444;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">⚠️ WARNING</div>
      <div style="font-size:52px;font-weight:900;margin-bottom:14px;line-height:1.2;">이사업체<br/>주의사항 🚨</div>
      <div style="font-size:22px;color:#666;margin-bottom:40px;">이것만 알면 사기 안 당해요</div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
        ${[
          ['❌ 피하세요', '구두 견적만 주는 업체 — 반드시 서면 계약서'],
          ['❌ 피하세요', '전액 선불 요구 — 50% 이상 선불은 위험'],
          ['❌ 피하세요', '보험/USDOT 번호 없는 업체'],
          ['✅ 확인하세요', 'Yelp/Google 리뷰 + BBB 등록 여부'],
          ['✅ 확인하세요', '짐 목록(Bill of Lading) 받기 — 서명 전 꼼꼼히'],
          ['✅ 확인하세요', '한인 이사업체 → dalkonnect.com/업소록'],
        ].map(([badge, text]) => `
          <div style="display:flex;gap:16px;align-items:flex-start;padding:18px 22px;background:rgba(255,255,255,0.05);border-radius:12px;">
            <div style="font-size:17px;font-weight:700;min-width:90px;color:${badge.includes('✅') ? '#7bed9f' : '#e94560'};background:rgba(255,255,255,0.07);padding:8px;border-radius:8px;text-align:center;">${badge}</div>
            <div style="font-size:21px;color:#ccc;line-height:1.4;">${text}</div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-05: CTA
    `<div style="width:1080px;height:1350px;background:linear-gradient(135deg,#f8f5f0 0%,#fff 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">5 / 5</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:5px;margin-bottom:40px;font-weight:700;">이사 완성 🏡</div>
      <div style="font-size:62px;font-weight:900;text-align:center;line-height:1.2;color:#222;margin-bottom:28px;">새 집에서<br/>새 출발<br/>응원합니다! 🎉</div>
      <div style="width:60px;height:4px;background:#e94560;margin-bottom:36px;"></div>
      <div style="font-size:24px;color:#888;text-align:center;margin-bottom:56px;line-height:1.6;">달라스 한인 이사업체 전체 목록<br/>→ <span style="color:#222;font-weight:700;">dalkonnect.com</span></div>
      <div style="background:#e94560;padding:22px 64px;border-radius:50px;font-size:32px;font-weight:800;color:white;margin-bottom:28px;">dalkonnect.com</div>
      <div style="font-size:22px;color:#bbb;margin-bottom:48px;">@dalkonnect</div>
      <div style="font-size:20px;color:#ccc;text-align:center;">📌 저장 & 공유해서 주변 분들께도 알려주세요!</div>
    </div>`,
  ]
};

// ─────────────────────────────────────────────
// POST 3: 달라스 필수 앱 (5 슬라이드)
// ─────────────────────────────────────────────
const POST3 = {
  dir: 'post3-apps',
  slides: [
    // slide-01: 표지
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">1 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:18px;color:#555;">@dalkonnect</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:6px;margin-bottom:36px;font-weight:700;">SAVE THIS 📌</div>
      <div style="width:80px;height:5px;background:#e94560;margin-bottom:40px;"></div>
      <div style="font-size:72px;font-weight:900;line-height:1.15;text-align:center;margin-bottom:28px;">달라스 한인<br/>필수 앱<br/>총정리 📱</div>
      <div style="font-size:26px;color:#888;margin-bottom:12px;text-align:center;">처음 달라스 오면 바로 깔아야 할 앱</div>
      <div style="font-size:22px;color:#e94560;font-weight:600;">← 슬라이드 넘겨보세요</div>
    </div>`,

    // slide-02: 쇼핑앱
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">2 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#ccc;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">🛒 SHOPPING APPS</div>
      <div style="font-size:56px;font-weight:900;color:#222;margin-bottom:14px;line-height:1.2;">쇼핑 앱<br/>이건 필수!</div>
      <div style="font-size:22px;color:#999;margin-bottom:44px;">장보기부터 온라인 쇼핑까지</div>
      <div style="display:flex;flex-direction:column;gap:22px;flex:1;">
        ${[
          ['🛍️', 'H-Mart App', '한인마트 세일/쿠폰 확인, 온라인 주문', '#e94560'],
          ['🚴', 'Instacart', '당일 식료품 배달 — H-Mart도 연결됨', '#2d8f4e'],
          ['📦', 'Amazon', 'Prime 멤버십으로 익일 배송 기본', '#f4a261'],
          ['🏷️', 'Rakuten', '쇼핑 캐시백 앱 — 아마존 최대 3% 환급', '#4cc9f0'],
          ['💲', 'Honey / Capital One Shopping', '자동 쿠폰 적용 크롬 확장', '#c9b1ff'],
        ].map(([emoji, name, desc, color]) => `
          <div style="background:white;padding:26px 32px;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.05);display:flex;gap:22px;align-items:center;">
            <div style="font-size:46px;min-width:60px;">${emoji}</div>
            <div style="flex:1;">
              <div style="font-size:28px;font-weight:800;color:#222;margin-bottom:6px;">${name}</div>
              <div style="font-size:20px;color:#888;">${desc}</div>
            </div>
            <div style="width:6px;min-height:50px;background:${color};border-radius:3px;"></div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-03: 교통앱
    `<div style="width:1080px;height:1350px;background:#111;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">3 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#444;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">🚗 TRANSPORT APPS</div>
      <div style="font-size:56px;font-weight:900;margin-bottom:14px;line-height:1.2;">교통 앱<br/>달라스 이동 필수</div>
      <div style="font-size:22px;color:#666;margin-bottom:40px;">차 없이도, 있어도 다 필요해요</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1;">
        ${[
          ['🗺️', 'Waze', '실시간 교통/경찰 정보, 달라스 운전자 1위', '#4cc9f0'],
          ['🚕', 'Uber / Lyft', '공항 픽업, 음주 후 귀가 필수', '#7bed9f'],
          ['🚇', 'DART GoPass', 'Dallas 지하철/버스 월정액 패스', '#f4a261'],
          ['🏎️', 'Google Maps', '대중교통 환승 계획, 한국어 지원', '#e94560'],
          ['✈️', 'FlightAware', 'DFW/DAL 항공 실시간 추적', '#c9b1ff'],
        ].map(([emoji, name, desc, color]) => `
          <div style="display:flex;gap:22px;align-items:center;padding:20px 26px;background:rgba(255,255,255,0.06);border-radius:14px;">
            <div style="font-size:42px;min-width:55px;">${emoji}</div>
            <div style="flex:1;">
              <div style="font-size:28px;font-weight:800;margin-bottom:6px;">${name}</div>
              <div style="font-size:20px;color:#aaa;">${desc}</div>
            </div>
            <div style="width:6px;min-height:50px;background:${color};border-radius:3px;"></div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-04: 생활앱
    `<div style="width:1080px;height:1350px;background:#f8f5f0;display:flex;flex-direction:column;font-family:'Noto Sans KR',sans-serif;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#bbb;letter-spacing:2px;">4 / 5</div>
      <div style="position:absolute;bottom:50px;left:0;right:0;text-align:center;font-size:16px;color:#ccc;">@dalkonnect · dalkonnect.com</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:4px;margin-bottom:16px;font-weight:700;">🏠 LIFE APPS</div>
      <div style="font-size:56px;font-weight:900;color:#222;margin-bottom:14px;line-height:1.2;">생활 앱<br/>이건 진짜 필수</div>
      <div style="font-size:22px;color:#999;margin-bottom:44px;">동네 생활부터 집 구하기까지</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1;">
        ${[
          ['👋', 'Nextdoor', '동네 커뮤니티 — 이웃 정보/분실물/무료나눔', '#2d8f4e'],
          ['🏠', 'Zillow / Realtor.com', '집 시세 확인, 렌트/매매 매물 탐색', '#e94560'],
          ['⭐', 'Yelp', '맛집/업체 리뷰, 한인 업소도 다수 등록', '#f4a261'],
          ['🏥', 'ZocDoc', '영어 걱정 없이 의사 예약 (언어 필터 가능)', '#4cc9f0'],
          ['💸', 'Zelle / Venmo', '미국 간편 송금 — 한인들도 많이 사용', '#c9b1ff'],
        ].map(([emoji, name, desc, color]) => `
          <div style="background:white;padding:24px 30px;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.05);display:flex;gap:20px;align-items:center;">
            <div style="font-size:42px;min-width:55px;">${emoji}</div>
            <div style="flex:1;">
              <div style="font-size:26px;font-weight:800;color:#222;margin-bottom:6px;">${name}</div>
              <div style="font-size:19px;color:#888;">${desc}</div>
            </div>
            <div style="width:6px;min-height:50px;background:${color};border-radius:3px;"></div>
          </div>
        `).join('')}
      </div>
    </div>`,

    // slide-05: CTA
    `<div style="width:1080px;height:1350px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Noto Sans KR',sans-serif;color:white;padding:80px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:60px;right:60px;font-size:18px;color:#555;letter-spacing:2px;">5 / 5</div>
      <div style="font-size:20px;color:#e94560;letter-spacing:5px;margin-bottom:40px;font-weight:700;">앱 설치 완료 📱</div>
      <div style="font-size:62px;font-weight:900;text-align:center;line-height:1.2;margin-bottom:28px;">달라스 생활,<br/>이제 앱으로<br/>스마트하게!</div>
      <div style="width:60px;height:4px;background:#e94560;margin-bottom:36px;"></div>
      <div style="font-size:24px;color:#a8b8d8;text-align:center;margin-bottom:56px;line-height:1.6;">더 많은 달라스 한인 생활 정보<br/>→ <span style="color:white;font-weight:700;">dalkonnect.com</span></div>
      <div style="background:#e94560;padding:22px 64px;border-radius:50px;font-size:32px;font-weight:800;margin-bottom:28px;">dalkonnect.com</div>
      <div style="font-size:22px;color:#5a6a8a;margin-bottom:48px;">@dalkonnect</div>
      <div style="font-size:20px;color:#444;text-align:center;">📌 저장 & 공유해서 주변 분들께도 알려주세요!</div>
    </div>`,
  ]
};

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────
async function generate() {
  console.log('🎨 DalKonnect March Life 포스트 생성 시작...\n');
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = [];

  for (const post of [POST1, POST2, POST3]) {
    const postDir = path.join(BASE_DIR, post.dir);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    console.log(`\n📂 ${post.dir}`);
    for (let i = 0; i < post.slides.length; i++) {
      const slideNum = String(i + 1).padStart(2, '0');
      const filename = `slide-${slideNum}.png`;
      const filePath = path.join(postDir, filename);

      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1350 });
      await page.setContent(wrapHtml(post.slides[i]), { waitUntil: 'networkidle0' });
      await page.screenshot({ path: filePath, type: 'png' });
      await page.close();

      console.log(`  ✅ ${post.dir}/${filename}`);
      results.push(`sns-cards/march-life/${post.dir}/${filename}`);
    }
  }

  await browser.close();

  console.log('\n🎉 완료!');
  console.log(`총 ${results.length}장 생성됨 → ${BASE_DIR}`);
  return results;
}

generate().catch(console.error);
