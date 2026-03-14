/**
 * DalKonnect 인트로 캐러셀 포스팅 (Instagram + Facebook)
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

const IMAGE_FILES = [
  '01-what-is-dalkonnect.png',
  '02-business-directory.png',
  '03-news-charts.png',
  '04-community.png',
];

const CAROUSEL_CAPTION = `🇰🇷🤠 달커넥트(DalKonnect)에 오신 것을 환영합니다!

달라스-포트워스 한인 커뮤니티를 위한 종합 포털입니다.

📍 한인 업소록 1,168개
📰 DFW 로컬뉴스 + 한국 최신 소식 매일 업데이트
🎵 K-컬쳐 차트 (음악·드라마·영화·유튜브)
🛍️ 사고팔기 · 공동구매 딜 · 커뮤니티

달라스 한인의 모든 것, 한 곳에서 👇
🔗 dalkonnect.com (링크 in bio)

#달커넥트 #DalKonnect #달라스한인 #DFW한인 #달라스 #텍사스한인 #DFWKorean #KoreanDallas #달라스맛집 #달라스업소록`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 이미지를 FB에 비공개 업로드 → URL 획득
async function uploadToFB(imgFile) {
  const form = new FormData();
  form.append('source', fs.createReadStream(path.join(INTRO_DIR, imgFile)));
  form.append('published', 'false');
  form.append('access_token', PAGE_TOKEN);

  const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const uploadData = await uploadRes.json();
  if (!uploadData.id) throw new Error(`FB upload failed: ${JSON.stringify(uploadData)}`);

  const urlRes = await fetch(`https://graph.facebook.com/v19.0/${uploadData.id}?fields=images&access_token=${PAGE_TOKEN}`);
  const urlData = await urlRes.json();
  const url = urlData.images?.[0]?.source;
  if (!url) throw new Error(`No URL for photo ${uploadData.id}`);
  return { photoId: uploadData.id, url };
}

async function postInstagramCarousel(imageUrls) {
  console.log('\n📸 Instagram 캐러셀 생성 중...');
  
  // Step 1: 각 이미지 컨테이너 생성 (carousel item)
  const containerIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrls[i],
        is_carousel_item: true,
        access_token: PAGE_TOKEN,
      }),
    });
    const data = await res.json();
    if (!data.id) throw new Error(`Carousel item ${i+1} failed: ${JSON.stringify(data)}`);
    containerIds.push(data.id);
    console.log(`  슬라이드 ${i+1}/4 컨테이너: ✅ ${data.id}`);
    await sleep(1000);
  }

  // Step 2: 캐러셀 컨테이너 생성
  console.log('  캐러셀 컨테이너 생성 중...');
  const carouselRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: containerIds.join(','),
      caption: CAROUSEL_CAPTION,
      access_token: PAGE_TOKEN,
    }),
  });
  const carouselData = await carouselRes.json();
  if (!carouselData.id) throw new Error(`Carousel container failed: ${JSON.stringify(carouselData)}`);
  console.log(`  캐러셀 컨테이너: ✅ ${carouselData.id}`);

  // Step 3: 준비 대기
  console.log('  미디어 준비 대기 (20초)...');
  await sleep(20000);

  // Step 4: 퍼블리시
  const pubRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carouselData.id, access_token: PAGE_TOKEN }),
  });
  const pubData = await pubRes.json();
  if (!pubData.id) throw new Error(`Publish failed: ${JSON.stringify(pubData)}`);
  console.log(`  ✅ Instagram 캐러셀 게시됨: ${pubData.id}`);
  return pubData.id;
}

async function postFacebookAlbum(photoIds) {
  console.log('\n📘 Facebook 멀티 포토 게시 중...');
  
  const attachedMedia = photoIds.map(id => ({ media_fbid: id }));
  
  const res = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: CAROUSEL_CAPTION,
      attached_media: attachedMedia,
      access_token: PAGE_TOKEN,
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`FB post failed: ${JSON.stringify(data)}`);
  console.log(`  ✅ Facebook 게시됨: ${data.id}`);
  return data.id;
}

async function main() {
  console.log('🚀 달커넥트 인트로 캐러셀 포스팅 시작!\n');

  // 이미지 4장 FB에 업로드
  console.log('📤 이미지 업로드 중...');
  const uploads = [];
  for (const file of IMAGE_FILES) {
    const result = await uploadToFB(file);
    uploads.push(result);
    console.log(`  ${file}: ✅ (${result.photoId})`);
  }

  const imageUrls = uploads.map(u => u.url);
  const photoIds = uploads.map(u => u.photoId);

  // Instagram 캐러셀
  await postInstagramCarousel(imageUrls);

  // Facebook 멀티 포토
  await postFacebookAlbum(photoIds);

  console.log('\n🎉 완료! FB + IG 캐러셀 게시됨');
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
