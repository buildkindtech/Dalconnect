const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/node_modules/node-fetch/lib/index.js').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
async function postSingle(file, caption) {
  const pid = await uploadPhoto(file);
  const url = await getUrl(pid);
  const igM = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: url, caption, access_token: TOKEN }),
  });
  const igD = await igM.json();
  await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: igD.id, access_token: TOKEN }),
  });
  const igPD = await igP.json();
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: caption, attached_media: [{ media_fbid: pid }], access_token: TOKEN }),
  });
  const fbD = await fbR.json();
  console.log('  ✅ IG:', igPD.id || JSON.stringify(igPD), '| FB:', fbD.id || JSON.stringify(fbD));
}

const DIR = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/travel-v2';

const posts = [
  {
    file: `${DIR}/01-road-trip.png`,
    caption: `🚗 달라스 봄방학 — 차로 3시간 이내 여행지 TOP 5

🌊 Galveston — 해변+리조트, 가족 최애 (4.5h)
🌉 San Antonio — 리버워크+시월드 2일 추천 (4.5h)
🎸 Austin — Barton Springs 자연수영장 무료 (3h)
🌸 Waco — Magnolia Market 당일 가능 (1.5h)
⛵ Lake Texoma — 호수캠핑 $30~50/박 (1.5h)

봄방학 어디 가세요? 댓글에 추천 장소 남겨주세요 👇

📍 더 많은 달라스 정보 → dalkonnect.com

#달커넥트 #달라스봄방학 #봄방학여행 #DFW가족여행 #달라스한인 #DFW한인 #봄방학`,
  },
  {
    file: `${DIR}/02-dallas-daytrip.png`,
    caption: `🏙️ 멀리 안 가도 돼 — 달라스 봄방학 당일 스팟

🦕 Perot Museum — 어른 $25 / 아이 $18 · 3세+ 추천
🐠 Dallas World Aquarium — 어른 $25 / 아이 $17 · 2세+ 추천
🧱 Legoland Discovery — 패키지 $35~ · 6-12세 최애
🌿 Klyde Warren Park — 무료! 분수놀이터 봄에 딱
🎨 Perot 천문관 — 금요일 오후 4-8pm 무료 입장

💡 Perot 멤버십 있으면 두 곳 다 할인!

📍 더 많은 달라스 정보 → dalkonnect.com

#달커넥트 #달라스봄방학 #달라스아이들 #DFW가족 #달라스한인 #봄방학당일치기`,
  },
  {
    file: `${DIR}/03-flight.png`,
    caption: `✈️ 봄방학 가족여행 — 지금 예약해야 하는 이유

⚠️ 미이란 전쟁 여파로 4월부터 항공 유류할증료 10만원↑ 인상 예고!

🎰 Las Vegas — DFW 직항 2.5h · 항공 $150~
🎡 Orlando — 직항 2.5h · 디즈니+유니버설 · $180~
🗽 New York — 직항 3.5h · 뮤지컬+자유의 여신상 · $200~
🏖️ Cancun — 직항 2.5h · 올인클루시브 리조트 · $250~

지금 예약 = 오르기 전 가격으로 절약 💡
빠를수록 좋아요!

📍 더 많은 달라스 정보 → dalkonnect.com/news

#달커넥트 #봄방학여행 #달라스출발 #DFW직항 #가족여행 #달라스한인 #항공특가 #봄방학`,
  },
];

async function main() {
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    console.log(`\n[${i+1}/3] 포스팅 중...`);
    await postSingle(p.file, p.caption);
    if (i < posts.length - 1) { console.log('  ⏳ 15초 대기...'); await sleep(15000); }
  }
  console.log('\n🎉 완료!');
}
main().catch(console.error);
