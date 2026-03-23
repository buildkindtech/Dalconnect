const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// node-fetch dynamic import wrapper
async function nodeFetch(url, opts) {
  const { default: f } = await import('node-fetch');
  return f(url, opts);
}

require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const MEDIA_DIR = '/Users/aaron/.openclaw/media';
const images = [
  { file: 'c2-1.jpg' },
  { file: 'c2-2.jpg' },
  { file: 'c2-3.jpg' },
  { file: 'c2-4-fix2.jpg' },
  { file: 'c2-5.jpg' },
];

const CAPTION = `🗞️ 이번 주 달라스 한인이 알아야 할 뉴스 5가지

1️⃣ 식스 플래그스 청소년 보호자 동반 필수
2️⃣ ICE, 공항에서 신분증 확인 시작
3️⃣ 충격! 김혜성 타율 4할인데 마이너리그
4️⃣ BTS·블랙핑크·스키즈 빌보드 차트 싹쓸이

👉 더 자세한 뉴스는 dalkonnect.com

#달라스 #DFW #달라스한인 #한인커뮤니티 #DalKonnect #달커넥트 #한인뉴스 #KPOP #김혜성 #ICE #식스플래그스`;

async function uploadToFB(filePath) {
  const form = new FormData();
  form.append('source', fs.createReadStream(filePath));
  form.append('published', 'false');
  form.append('access_token', FB_TOKEN);
  const r = await nodeFetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) throw new Error(`FB upload failed: ${JSON.stringify(d)}`);
  // CDN URL 가져오기
  const ur = await nodeFetch(`https://graph.facebook.com/v19.0/${d.id}?fields=images&access_token=${FB_TOKEN}`);
  const ud = await ur.json();
  const cdnUrl = ud.images?.[0]?.source;
  console.log(`  📤 FB 업로드 완료: ${d.id} | URL: ${cdnUrl?.substring(0,60)}...`);
  return { photoId: d.id, cdnUrl };
}

async function postCarousel() {
  console.log('🚀 캐러셀 인스타 포스팅 시작\n');

  // 1. 각 이미지를 FB에 업로드
  const mediaItems = [];
  for (const img of images) {
    const filePath = path.join(MEDIA_DIR, img.file);
    console.log(`📤 업로드 중: ${img.file}`);
    const { cdnUrl } = await uploadToFB(filePath);
    if (!cdnUrl) { console.log('  ❌ CDN URL 없음, 스킵'); continue; }

    // IG 미디어 컨테이너 생성 (carousel item)
    const createRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: cdnUrl,
        is_carousel_item: true,
        access_token: FB_TOKEN,
      }),
    });
    const createData = await createRes.json();
    if (!createData.id) { console.log(`  ❌ IG container 실패: ${JSON.stringify(createData)}`); continue; }
    console.log(`  ✅ IG container: ${createData.id}`);
    mediaItems.push(createData.id);
    await new Promise(r => setTimeout(r, 1000));
  }

  if (mediaItems.length === 0) { console.log('❌ 업로드된 미디어 없음'); return; }

  console.log(`\n📱 캐러셀 게시 (${mediaItems.length}장)...`);

  // 2. 캐러셀 컨테이너 생성
  const carouselRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: mediaItems,
      caption: CAPTION,
      access_token: FB_TOKEN,
    }),
  });
  const carouselData = await carouselRes.json();
  if (!carouselData.id) { console.log(`❌ 캐러셀 생성 실패: ${JSON.stringify(carouselData)}`); return; }
  console.log(`  ✅ 캐러셀 container: ${carouselData.id}`);

  // 3. 대기 후 게시
  await new Promise(r => setTimeout(r, 5000));

  const publishRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: carouselData.id,
      access_token: FB_TOKEN,
    }),
  });
  const pubResult = await publishRes.json();
  if (pubResult.id) {
    console.log(`\n🎉 인스타 캐러셀 게시 완료! ID: ${pubResult.id}`);
  } else {
    console.log(`❌ 게시 실패: ${JSON.stringify(pubResult)}`);
  }
}

postCarousel().catch(console.error);
