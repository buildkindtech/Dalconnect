/**
 * DalKonnect 브랜드 카드 9장 + 인트로 캐러셀
 * 포스팅 순서: A→E→C→04→03→B→01→02→D→캐러셀
 * 핀: 캐러셀(top-left) + D-welcome(top-mid) + 02-directory(top-right)
 */
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '17841440398453483';
const BRAND_DIR = path.join(__dirname, '..', 'sns-cards', 'brand');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 포스팅 순서 (역순 = 오래된 것부터)
const POSTS = [
  {
    file: 'A-how-to-use.png',
    fb: `💡 달커넥트 사용법을 알려드려요!\n\n🔍 업소 찾기 — 카테고리 → 지도에서 바로 확인\n📰 뉴스 보기 — DFW + 한국 소식 매일 업데이트\n🛍️ 사고팔기 — 달라스 한인 중고거래\n🏷️ 딜 확인 — H-Mart, 한인업소 특가\n🎵 차트 보기 — K-POP · 드라마 · 영화 랭킹\n\n👉 dalkonnect.com\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인`,
    ig: `💡 달커넥트 이렇게 쓰세요!\n\n🔍업소찾기 📰뉴스 🛍️사고팔기 🏷️딜 🎵차트\n\n👉 dalkonnect.com (링크 in bio)\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스`,
  },
  {
    file: 'E-google-map.png',
    fb: `🗺️ 달커넥트 = 달라스 한인을 위한 구글맵 + 커뮤니티\n\n뭔가 찾고 싶을 때 달커넥트를 먼저 여세요!\n\n🔍 한인 병원 → 지도에서 바로 확인\n📰 한국 뉴스 → DFW + 한국 한곳에서\n🛍️ 중고거래 → 달라스 한인 게시판\n🍽️ 맛집 → 1,168개 업소 확인\n📺 K-드라마 → 넷플릭스 차트 한눈에\n\n👉 dalkonnect.com\n\n#달라스한인 #DFW한인 #달커넥트 #DalKonnect`,
    ig: `🗺️ 달라스 한인의 구글맵 + 커뮤니티!\n\n한인병원 · 뉴스 · 사고팔기 · 맛집 · 차트\n모두 달커넥트 하나로!\n\n👉 dalkonnect.com (링크 in bio)\n\n#달커넥트 #DalKonnect #달라스한인 #DFW #텍사스한인`,
  },
  {
    file: 'C-register-business.png',
    fb: `🏪 달라스에서 사업하세요? 달커넥트에 무료로 등록하세요!\n\n✅ 완전 무료 — 등록 비용 없음\n👥 1,168개 — 이미 등록된 한인 업소\n📍 지도 노출 — 달라스 한인들에게 발견\n📊 매일 방문자 — 커뮤니티 포털 트래픽\n\n👉 dalkonnect.com/businesses\n📧 info@dalkonnect.com\n\n#달라스한인업소 #달라스비즈니스 #달커넥트 #DFW한인`,
    ig: `🏪 달라스 사업자분들!\n달커넥트에 무료로 업소 등록하세요 👆\n\n✅무료 📍지도노출 👥1,168개 업소 이미 등록 중\n\n👉 dalkonnect.com/businesses (링크 in bio)\n\n#달라스한인업소 #달라스비즈니스 #달커넥트 #DFW한인 #달라스`,
  },
  {
    file: '04-community.png',
    fb: `🤝 달라스 한인 커뮤니티 공간이 열렸습니다!\n\n💬 자유 게시판 — 달라스 한인들의 이야기\n🛍️ 사고팔기 — 중고거래, 나눔, 구인구직\n🏷️ 공동구매 딜 — H-Mart, 한인업소 특가\n📍 업체 등록 — 내 가게를 달커넥트에\n\n👉 dalkonnect.com/community\n\n#달라스한인커뮤니티 #달라스사고팔기 #달라스중고 #달커넥트 #DFW한인`,
    ig: `🤝 달라스 한인 커뮤니티 공간!\n\n💬자유게시판 🛍️사고팔기 🏷️딜 📍업체등록\n\n함께 만들어가는 DFW 한인 공간 🇰🇷\n\n👉 dalkonnect.com (링크 in bio)\n\n#달라스한인 #DFW한인 #달라스사고팔기 #달커넥트 #DalKonnect`,
  },
  {
    file: '03-news-charts.png',
    fb: `📰🎵 뉴스부터 K-컬쳐 차트까지, 달커넥트 하나로!\n\n📰 DAILY NEWS\n• DFW 로컬뉴스 + 한국 최신 소식\n• 매일 업데이트 · 1,000개+ 기사\n\n🎵 K-CULTURE CHARTS\n• 음악 · 드라마 · 영화 순위\n• 넷플릭스 · 유튜브 · 멜론 매일 업데이트\n\n👉 dalkonnect.com/news\n\n#달라스뉴스 #DFW뉴스 #KPOP차트 #한국드라마 #달커넥트`,
    ig: `📰 뉴스 + 🎵 K-차트, 달커넥트에서!\n\n달라스 뉴스 + 한국 소식 매일 업데이트\n음악·드라마·영화 순위도 매일!\n\n👉 dalkonnect.com (링크 in bio)\n\n#달라스뉴스 #KPOP #한국드라마 #넷플릭스 #달커넥트 #DalKonnect`,
  },
  {
    file: 'B-why-we-built.png',
    fb: `💭 우리가 달커넥트를 만든 이유\n\n달라스 처음 왔을 때 정보 찾기가 너무 힘들었어요.\n\n한인 병원이 어디 있는지,\n괜찮은 한식당은 어디인지,\n커뮤니티 소식은 어디서 보는지...\n\n그래서 만들었습니다.\n달라스 한인의 모든 것, 한 곳에서.\n\n👉 dalkonnect.com\n\n#달라스한인 #DFW한인 #달커넥트 #DalKonnect #달라스이민`,
    ig: `💭 우리가 달커넥트를 만든 이유\n\n달라스 처음 왔을 때\n정보 찾기가 너무 힘들었어요.\n\n그래서 만들었습니다 🙌\n\n👉 dalkonnect.com (링크 in bio)\n\n#달라스한인 #DFW한인 #달라스이민 #달커넥트 #DalKonnect #텍사스한인`,
  },
  {
    file: '01-intro.png',
    fb: `🇰🇷🤠 달커넥트(DalKonnect)를 소개합니다!\n\n달라스-포트워스 한인 커뮤니티를 위한 종합 포털\n\n📍 한인 업소록 1,168개\n📰 DFW 로컬뉴스 + 한국 소식\n🎵 K-컬쳐 차트\n🛍️ 사고팔기 · 공동구매 딜 · 커뮤니티\n\n달라스 한인의 모든 것, 한 곳에서 👇\n👉 dalkonnect.com\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인`,
    ig: `🇰🇷🤠 달커넥트 소개!\n\nDFW 한인 커뮤니티 종합 포털\n업소록 · 뉴스 · 사고팔기 · 차트\n\n👉 dalkonnect.com (링크 in bio)\n\n#달커넥트 #DalKonnect #달라스한인 #DFW #텍사스한인 #달라스 #DFWKorean`,
  },
  {
    file: '02-directory.png',  // PIN용
    fb: `📍 DFW 한인 업소록 1,168개!\n\n한식당🍽️ 미용실💇 병원🏥 교회⛪ 마트🛒\n부동산🏠 법률⚖️ 치과🦷 태권도🥋 네일💅\n\n달라스-포트워스 한인 업소 정보를 한눈에!\n\n👉 dalkonnect.com/businesses\n\n#달라스한인업소 #DFW한인 #달라스맛집 #달라스미용실 #달라스교회 #달커넥트`,
    ig: `📍 DFW 한인 업소 1,168개!\n\n한식당🍽️ 미용실💇 병원🏥 교회⛪\n마트🛒 부동산🏠 법률⚖️ 태권도🥋\n\n👉 dalkonnect.com (링크 in bio)\n\n#달라스한인 #DFW한인업소 #달라스맛집 #달커넥트 #DalKonnect #달라스`,
  },
  {
    file: 'D-welcome.png',  // PIN용 (가장 나중에 올림 = 최신)
    fb: `🇰🇷🤠 달라스 한인 여러분 환영합니다!\n\nDallas–Fort Worth에 사는 한인 여러분을 위해 달커넥트가 함께합니다 🙌\n\n팔로우하고 함께해요!\n👉 dalkonnect.com | @dalkonnect\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas`,
    ig: `🇰🇷🤠 달라스 한인 여러분 환영합니다!\n\nDFW에 사는 한인 여러분을 위해\n달커넥트가 함께합니다 🙌\n\n팔로우하고 함께해요 👆\n\n👉 dalkonnect.com (링크 in bio)\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas`,
  },
];

// 인트로 캐러셀 (마지막, 핀 예정)
const CAROUSEL_FILES = ['01-intro.png','02-directory.png','03-news-charts.png','04-community.png'];
const CAROUSEL_CAPTION = `🇰🇷🤠 달커넥트(DalKonnect)에 오신 것을 환영합니다!\n\n달라스-포트워스 한인 커뮤니티를 위한 종합 포털입니다.\n\n📍 한인 업소록 1,168개\n📰 DFW 로컬뉴스 + 한국 소식 매일 업데이트\n🎵 K-컬쳐 차트 (음악·드라마·영화·유튜브)\n🛍️ 사고팔기 · 공동구매 딜 · 커뮤니티\n\n달라스 한인의 모든 것, 한 곳에서 👇\n🔗 dalkonnect.com (링크 in bio)\n\n#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스맛집 #달라스업소록`;

async function uploadToFB(imgFile) {
  const form = new FormData();
  form.append('source', fs.createReadStream(path.join(BRAND_DIR, imgFile)));
  form.append('published', 'false');
  form.append('access_token', PAGE_TOKEN);
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) throw new Error(`Upload failed: ${JSON.stringify(d)}`);
  const ur = await fetch(`https://graph.facebook.com/v19.0/${d.id}?fields=images&access_token=${PAGE_TOKEN}`);
  const ud = await ur.json();
  return { photoId: d.id, url: ud.images?.[0]?.source };
}

async function postFBPhoto(imgFile, caption) {
  const form = new FormData();
  form.append('source', fs.createReadStream(path.join(BRAND_DIR, imgFile)));
  form.append('caption', caption);
  form.append('access_token', PAGE_TOKEN);
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  return r.json();
}

async function postIGPhoto(imageUrl, caption) {
  const cr = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: PAGE_TOKEN }),
  });
  const cd = await cr.json();
  if (!cd.id) return cd;
  await sleep(8000);
  const pr = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: cd.id, access_token: PAGE_TOKEN }),
  });
  return pr.json();
}

async function postCarousel(imageUrls, caption) {
  const containerIds = [];
  for (const url of imageUrls) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: PAGE_TOKEN }),
    });
    const d = await r.json();
    if (!d.id) throw new Error(`Carousel item failed: ${JSON.stringify(d)}`);
    containerIds.push(d.id);
    await sleep(1000);
  }
  const cr = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: containerIds.join(','), caption, access_token: PAGE_TOKEN }),
  });
  const cd = await cr.json();
  if (!cd.id) throw new Error(`Carousel container failed: ${JSON.stringify(cd)}`);
  await sleep(20000);
  const pr = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: cd.id, access_token: PAGE_TOKEN }),
  });
  return pr.json();
}

async function main() {
  console.log('🚀 달커넥트 브랜드 그리드 포스팅 시작!\n');
  
  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const isPinPost = post.file === 'D-welcome.png' || post.file === '02-directory.png';
    console.log(`--- [${i+1}/9] ${post.file} ${isPinPost ? '📌PIN' : ''} ---`);
    
    // FB 포스트
    const fbResult = await postFBPhoto(post.file, post.fb);
    console.log(`  FB: ${fbResult.id ? '✅ '+fbResult.id : '❌ '+JSON.stringify(fbResult)}`);
    
    // IG: FB upload → URL → IG post
    const { photoId, url } = await uploadToFB(post.file);
    const igResult = await postIGPhoto(url, post.ig);
    console.log(`  IG: ${igResult.id ? '✅ '+igResult.id : '❌ '+JSON.stringify(igResult)}`);
    
    if (i < POSTS.length - 1) {
      console.log('  ⏳ 15초 대기...');
      await sleep(15000);
    }
  }
  
  // 캐러셀 (마지막)
  console.log('\n--- [캐러셀] 인트로 4장 ---');
  const uploads = [];
  for (const f of CAROUSEL_FILES) {
    const { url } = await uploadToFB(f);
    uploads.push(url);
    await sleep(1000);
  }
  // FB 멀티포토
  const fbIds = [];
  for (const f of CAROUSEL_FILES) {
    const form = new FormData();
    form.append('source', fs.createReadStream(path.join(BRAND_DIR, f)));
    form.append('published', 'false');
    form.append('access_token', PAGE_TOKEN);
    const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
    const d = await r.json();
    fbIds.push(d.id);
  }
  const fbCarousel = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: CAROUSEL_CAPTION, attached_media: fbIds.map(id => ({ media_fbid: id })), access_token: PAGE_TOKEN }),
  });
  const fbCarouselData = await fbCarousel.json();
  console.log(`  FB: ${fbCarouselData.id ? '✅ '+fbCarouselData.id : '❌ '+JSON.stringify(fbCarouselData)}`);
  
  const igCarousel = await postCarousel(uploads, CAROUSEL_CAPTION);
  console.log(`  IG: ${igCarousel.id ? '✅ '+igCarousel.id : '❌ '+JSON.stringify(igCarousel)}`);
  
  console.log('\n🎉 전체 완료!');
  console.log('\n📌 인스타 앱에서 핀 달기 (3개):');
  console.log('  1. 캐러셀 (인트로 4장 슬라이드)');
  console.log('  2. D-welcome (달라스 한인 여러분 환영합니다!)');
  console.log('  3. 02-directory (DFW 한인 업소 1,168개)');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
