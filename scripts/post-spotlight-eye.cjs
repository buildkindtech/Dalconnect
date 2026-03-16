const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/node_modules/node-fetch/lib/index.js').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SLIDES = [
  '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye/slide-00-cover.png',
  '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye/slide-01-review.png',
  '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye/slide-02-review.png',
  '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye/slide-03-review.png',
  '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye/slide-04-cta.png',
];

const CAPTION = `✨ 업체 스팟라이트 — 김상우 안과

DFW 한인 안과 전문의 Ryan S. Kim, M.D.
⭐ Google 5.0 만점 · 88개 리뷰

🔹 수술 안과 전문의
🔹 한국어 상담 가능
🔹 주말 진료 가능

📍 3425 Grande Bulevar Blvd, Irving TX
📞 (972) 639-5836

달커넥트에 등록된 DFW 한인 우수 업체를 소개합니다 🙌
👉 dalkonnect.com/businesses

#달커넥트 #DFW한인 #달라스한인 #한인안과 #김상우안과 #Irving #업체스팟라이트 #한인업체`;

async function uploadPhoto(filePath) {
  const form = new FormData();
  form.append('source', fs.createReadStream(filePath));
  form.append('published', 'false');
  form.append('access_token', TOKEN);
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) throw new Error('Upload failed: ' + JSON.stringify(d));
  return d.id;
}

async function getUrl(pid) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${pid}?fields=images&access_token=${TOKEN}`);
  const d = await r.json();
  return d.images?.[0]?.source;
}

async function main() {
  console.log('📤 슬라이드 5장 업로드 중...');
  const pids = [], urls = [];
  for (let i = 0; i < SLIDES.length; i++) {
    const pid = await uploadPhoto(SLIDES[i]);
    const url = await getUrl(pid);
    pids.push(pid); urls.push(url);
    console.log(`  ✅ 슬라이드 ${i+1}/5 업로드 완료`);
    await sleep(1500);
  }

  // Instagram 캐러셀
  console.log('\n📸 Instagram 캐러셀 포스팅...');
  const children = [];
  for (const url of urls) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: TOKEN }),
    });
    const d = await r.json();
    if (!d.id) { console.log('  ⚠️ IG item 실패:', JSON.stringify(d)); continue; }
    children.push(d.id);
    await sleep(2000);
  }

  const carousel = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: children.join(','), caption: CAPTION, access_token: TOKEN }),
  });
  const carD = await carousel.json();
  if (!carD.id) { console.log('  ⚠️ 캐러셀 생성 실패:', JSON.stringify(carD)); }

  await sleep(8000);
  const pub = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carD.id, access_token: TOKEN }),
  });
  const pubD = await pub.json();
  console.log('  ✅ Instagram:', pubD.id || JSON.stringify(pubD));

  // Facebook — 첫 사진 + 캡션
  console.log('\n📘 Facebook 포스팅...');
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: CAPTION,
      attached_media: pids.map(id => ({ media_fbid: id })),
      access_token: TOKEN,
    }),
  });
  const fbD = await fbR.json();
  console.log('  ✅ Facebook:', fbD.id || JSON.stringify(fbD));

  console.log('\n🎉 포스팅 완료!');
}

main().catch(console.error);
