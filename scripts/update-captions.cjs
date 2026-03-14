/**
 * 기존 포스트 캡션 + 해시태그 업데이트
 */
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const UPDATES = [
  {
    id: '17861767227610612', // A-how-to-use
    caption: `💡 달커넥트, 이렇게 쓰세요!

🔍 업소 찾기 — 카테고리 선택 후 지도에서 바로 확인
📰 뉴스 보기 — DFW 로컬 + 한국 소식 매일 업데이트
🛍️ 사고팔기 — 달라스 한인 중고거래 · 나눔 · 구인구직
🏷️ 딜 확인 — H-Mart, 한인업소 특가 공동구매
🎵 차트 보기 — K-POP · 드라마 · 영화 · 유튜브 랭킹

👉 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스생활 #달라스이민 #한인커뮤니티 #재미교포`,
  },
  {
    id: '18162498325421997', // E-google-map
    caption: `🗺️ 달라스 한인을 위한 구글맵 + 커뮤니티

뭔가 찾고 싶을 때 달커넥트를 먼저 여세요!

🏥 한인 병원 → 지도에서 바로 확인
📰 한국 뉴스 → DFW + 한국 한곳에서
🛍️ 중고거래 → 달라스 한인 게시판
🍽️ 맛집 → 1,168개 업소 확인
📺 K-드라마 → 넷플릭스 차트 한눈에

👉 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스맛집 #달라스병원 #달라스정착 #달라스생활`,
  },
  {
    id: '18023117582815508', // C-register-business
    caption: `🏪 달라스에서 사업하세요?
달커넥트에 무료로 업소 등록하세요!

✅ 완전 무료 — 등록 비용 없음
📍 지도 노출 — 달라스 한인들에게 발견
👥 1,168개 — 이미 등록된 한인 업소
📊 매일 방문 — 커뮤니티 포털 트래픽

👉 dalkonnect.com/businesses (링크 in bio)
📧 info@dalkonnect.com

#달라스한인업소 #달라스비즈니스 #달라스소상공인 #달라스가게 #달라스창업 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #DFWKorean #한인비즈니스 #KoreanDallas #무료등록`,
  },
  {
    id: '18097649254797948', // 04-community
    caption: `🤝 달라스 한인 커뮤니티 공간이 열렸습니다!

💬 자유 게시판 — 달라스 한인들의 이야기
🛍️ 사고팔기 — 중고거래, 나눔, 구인구직
🏷️ 공동구매 딜 — H-Mart, 한인업소 특가
📍 업체 등록 — 내 가게를 달커넥트에

함께 만들어가는 DFW 한인 공간 🇰🇷

👉 dalkonnect.com (링크 in bio)

#달라스한인커뮤니티 #달라스사고팔기 #달라스중고 #달라스나눔 #달라스구인구직 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #한인커뮤니티 #재미교포 #KoreanDallas`,
  },
  {
    id: '17997192038867384', // 03-news-charts
    caption: `📰🎵 뉴스부터 K-컬쳐 차트까지, 달커넥트 하나로!

📰 DAILY NEWS
DFW 로컬뉴스 + 한국 최신 소식
매일 업데이트 · 1,000개+ 기사

🎵 K-CULTURE CHARTS
음악 · 드라마 · 영화 순위
넷플릭스 · 유튜브 · 멜론 매일 업데이트

👉 dalkonnect.com (링크 in bio)

#달라스뉴스 #DFW뉴스 #한국뉴스 #KPOP #케이팝 #한국드라마 #넷플릭스코리아 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #KoreanDallas`,
  },
  {
    id: '18412846315120938', // B-why-we-built
    caption: `💭 우리가 달커넥트를 만든 이유

달라스 처음 왔을 때 정보 찾기가 너무 힘들었어요.

한인 병원이 어디 있는지,
괜찮은 한식당은 어디인지,
커뮤니티 소식은 어디서 보는지...

그래서 만들었습니다.
달라스 한인의 모든 것, 한 곳에서. 🙌

👉 dalkonnect.com (링크 in bio)

#달라스한인 #DFW한인 #달라스이민 #달라스정착 #달라스생활 #달커넥트 #DalKonnect #텍사스한인 #재미교포 #한인커뮤니티 #KoreanDallas #달라스`,
  },
  {
    id: '18080699897458239', // 01-intro
    caption: `🇰🇷🤠 달커넥트(DalKonnect)를 소개합니다!

달라스-포트워스 한인 커뮤니티를 위한 종합 포털

📍 한인 업소록 1,168개
📰 DFW 로컬뉴스 + 한국 소식
🎵 K-컬쳐 차트
🛍️ 사고팔기 · 공동구매 딜 · 커뮤니티

달라스 한인의 모든 것, 한 곳에서 👇

👉 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스생활 #한인커뮤니티 #재미교포 #달라스이민`,
  },
  {
    id: '17985237788952849', // 02-directory (PIN)
    caption: `📍 DFW 한인 업소 1,168개, 한 곳에서!

한식당🍽️ 미용실💇 병원🏥 교회⛪
마트🛒 부동산🏠 법률⚖️ 치과🦷
태권도🥋 네일💅 교육🎓 자동차🚗

달라스-포트워스 한인 업소 정보를 한눈에!

👉 dalkonnect.com/businesses (링크 in bio)

#달라스한인 #DFW한인업소 #달라스맛집 #달라스미용실 #달라스한식당 #달라스병원 #달라스교회 #달라스부동산 #달커넥트 #DalKonnect #KoreanDallas #DFWKorean #달라스한인업소`,
  },
  {
    id: '18003334952855439', // D-welcome (PIN)
    caption: `🇰🇷🤠 달라스 한인 여러분 환영합니다!

Dallas–Fort Worth에 사는 한인 여러분을 위해
달커넥트가 함께합니다 🙌

업소록 · 뉴스 · 사고팔기 · 차트
달라스 한인의 모든 것, 한 곳에서!

팔로우하고 함께해요 👆
👉 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #재미교포 #달라스생활 #달라스이민 #한인커뮤니티`,
  },
  {
    id: '18456154084098356', // 캐러셀
    caption: `🇰🇷🤠 달커넥트(DalKonnect)에 오신 것을 환영합니다!

달라스-포트워스 한인 커뮤니티를 위한 종합 포털입니다.

📍 한인 업소록 1,168개
📰 DFW 로컬뉴스 + 한국 소식 매일 업데이트
🎵 K-컬쳐 차트 (음악·드라마·영화·유튜브)
🛍️ 사고팔기 · 공동구매 딜 · 커뮤니티

달라스 한인의 모든 것, 한 곳에서 👇
👉 dalkonnect.com (링크 in bio)

← 슬라이드해서 더 보기!

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스맛집 #달라스업소록 #재미교포 #한인커뮤니티 #달라스생활 #달라스이민`,
  },
];

async function main() {
  console.log('✏️ 캡션 업데이트 중...\n');
  for (const post of UPDATES) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${post.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: post.caption, comment_enabled: true, access_token: TOKEN }),
    });
    const d = await r.json();
    console.log(`${post.id}: ${d.success ? '✅' : '❌ '+JSON.stringify(d)}`);
    await sleep(2000);
  }
  console.log('\n✅ 전체 캡션 업데이트 완료!');
}
main().catch(console.error);
