/**
 * 인트로 카드 4장 FB + IG 포스팅
 */
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '17841440398453483';
const INTRO_DIR = path.join(__dirname, '..', 'sns-cards', 'intro');

const CARDS = [
  {
    file: '01-what-is-dalkonnect.png',
    fb_caption: `🇰🇷🤠 달커넥트(DalKonnect)가 오픈했습니다!

달라스-포트워스 한인 커뮤니티를 위한 종합 포털입니다.
업소록, 뉴스, 사고팔기, 공동구매, K-컬쳐 차트까지
한 곳에서 편리하게 이용하세요.

👉 dalkonnect.com

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인`,
    ig_caption: `🇰🇷🤠 달커넥트 오픈!

DFW 한인 커뮤니티 포털이 문을 열었습니다.
업소록·뉴스·사고팔기·딜·차트 한 곳에서!

👉 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW #텍사스한인 #달라스 #DFWKorean #KoreanDallas`,
  },
  {
    file: '02-business-directory.png',
    fb_caption: `📍 DFW 한인 업소록 1,168개!

한식당부터 미용실, 병원, 교회, 부동산, 법률까지
달라스-포트워스 한인 업소 정보를 한눈에!

지금 바로 검색해보세요 👇
👉 dalkonnect.com/businesses

#달라스한인업소 #DFW한인 #달라스맛집 #달라스미용실 #달라스교회 #달커넥트`,
    ig_caption: `📍 DFW 한인 업소 1,168개 한 곳에!

한식당🍽️ 미용실💇 병원🏥 교회⛪
마트🛒 부동산🏠 법률⚖️ 치과🦷

👉 dalkonnect.com (링크 in bio)

#달라스한인 #DFW한인업소 #달라스맛집 #텍사스한인 #달커넥트 #DalKonnect #달라스 #KoreanDallas`,
  },
  {
    file: '03-news-charts.png',
    fb_caption: `📰 DFW 로컬 뉴스 + 한국 최신 소식을 매일 업데이트!

달라스 지역 뉴스부터 한국 뉴스, K-POP, 드라마 차트까지
달커넥트 하나로 다 확인하세요.

🎵 음악 차트 | 📺 드라마 | 🎬 영화 | 넷플릭스 | 유튜브

👉 dalkonnect.com/news

#달라스뉴스 #DFW뉴스 #한국뉴스 #KPOP차트 #달커넥트 #DalKonnect`,
    ig_caption: `📰 매일 업데이트되는 뉴스 & 차트!

DFW 로컬뉴스 + 한국뉴스
🎵음악 📺드라마 🎬영화 차트까지

👉 dalkonnect.com (링크 in bio)

#달라스뉴스 #한국뉴스 #KPOP #드라마차트 #달커넥트 #DalKonnect #DFW한인 #텍사스한인`,
  },
  {
    file: '04-community.png',
    fb_caption: `🤝 달라스 한인 커뮤니티 공간이 열렸습니다!

💬 자유 게시판 — 달라스 한인들의 이야기
🛍️ 사고팔기 — 중고거래, 나눔, 구인구직
🏷️ 공동구매 딜 — H-Mart, 한인 업소 특가
📍 업체 등록 — 내 가게를 달커넥트에

👉 dalkonnect.com/community

#달라스한인커뮤니티 #DFW한인 #달라스사고팔기 #달라스중고 #달커넥트 #DalKonnect`,
    ig_caption: `🤝 달라스 한인 커뮤니티 공간!

💬자유게시판 🛍️사고팔기
🏷️공동구매딜 📍업체등록

함께 만들어가는 DFW 한인 공간 🇰🇷

👉 dalkonnect.com (링크 in bio)

#달라스한인 #DFW한인 #달라스사고팔기 #텍사스한인 #달커넥트 #DalKonnect #KoreanDallas`,
  },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function postToFacebook(card) {
  const form = new FormData();
  form.append('source', fs.createReadStream(path.join(INTRO_DIR, card.file)));
  form.append('caption', card.fb_caption);
  form.append('access_token', PAGE_TOKEN);
  
  const res = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, {
    method: 'POST',
    body: form,
  });
  return res.json();
}

async function postToInstagram(card) {
  // Step 1: 이미지를 Facebook에 먼저 올려서 공개 URL 획득
  const form = new FormData();
  form.append('source', fs.createReadStream(path.join(INTRO_DIR, card.file)));
  form.append('published', 'false'); // 비공개로 업로드 (URL만 획득용)
  form.append('access_token', PAGE_TOKEN);
  
  const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, {
    method: 'POST', body: form,
  });
  const uploadData = await uploadRes.json();
  
  if (!uploadData.id) {
    return { error: 'FB upload failed', detail: uploadData };
  }
  
  // 이미지 URL 획득
  const urlRes = await fetch(`https://graph.facebook.com/v19.0/${uploadData.id}?fields=images&access_token=${PAGE_TOKEN}`);
  const urlData = await urlRes.json();
  const imageUrl = urlData.images?.[0]?.source;
  
  if (!imageUrl) return { error: 'No image URL', detail: urlData };
  
  // Step 2: IG 컨테이너 생성
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption: card.ig_caption, access_token: PAGE_TOKEN }),
  });
  const containerData = await containerRes.json();
  
  if (!containerData.id) return { error: 'IG container failed', detail: containerData };
  
  // Step 3: 미디어 준비 대기
  for (let i = 0; i < 5; i++) {
    await sleep(4000);
    const statusRes = await fetch(`https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code&access_token=${PAGE_TOKEN}`);
    const status = await statusRes.json();
    if (status.status_code === 'FINISHED') break;
  }
  
  // Step 4: 퍼블리시
  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerData.id, access_token: PAGE_TOKEN }),
  });
  return pubRes.json();
}

async function main() {
  console.log('🚀 인트로 카드 4장 포스팅 시작...\n');
  
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    console.log(`--- 카드 ${i+1}/4: ${card.file} ---`);
    
    // Facebook
    const fbResult = await postToFacebook(card);
    console.log(`  FB: ${fbResult.id ? '✅ ' + fbResult.id : '❌ ' + JSON.stringify(fbResult)}`);
    
    // Instagram
    const igResult = await postToInstagram(card);
    console.log(`  IG: ${igResult.id ? '✅ ' + igResult.id : '❌ ' + JSON.stringify(igResult)}`);
    
    // 연속 포스팅 간격 (스팸 방지)
    if (i < CARDS.length - 1) {
      console.log('  ⏳ 15초 대기...');
      await sleep(15000);
    }
  }
  
  console.log('\n✅ 전체 포스팅 완료!');
}

main().catch(console.error);
