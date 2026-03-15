const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
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
  if (!d.id) throw new Error(JSON.stringify(d));
  return d.id;
}

async function getImageUrl(pid) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${pid}?fields=images&access_token=${TOKEN}`);
  const d = await r.json();
  return d.images?.[0]?.source;
}

const chartCaption = `🎬 이번 주 한국 영화 박스오피스 TOP 5!

1위 👑 왕과 사는 남자 (22만명)
2위 🔥 삼악도 (8,864명)
3위 🎬 F1 더 무비 (6,977명)
4위 🕵️ 휴민트 (4,308명)
5위 ⚔️ 극장판 진격의 거인 (4,225명)

이번 주 뭐 볼지 고민이라면? 👇
👉 dalkonnect.com/charts

#한국영화 #박스오피스 #영화차트 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #KoreanMovie #KoreanDallas #재미교포`;

const foodCaption = `🍽️ DFW 달라스 한인 맛집 TOP 5!

달커넥트 실제 리뷰 기반 한인 식당 베스트 🔥

🥇 Chicken Barn — Frisco ⭐4.9 (리뷰 1,356개)
🥈 Gold Spoon 금수저 — Carrollton ⭐4.9
🥉 Hong Dumpling House — Dallas ⭐4.9
4️⃣ Dol dol Mara — Plano ⭐5.0
5️⃣ Geupshik — Lewisville ⭐5.0

더 많은 DFW 한인 식당 👇
👉 dalkonnect.com/businesses

#달라스맛집 #DFW맛집 #달라스한식 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanFood #KoreanDallas #달라스식당 #재미교포`;

(async () => {
  // 1. 영화 차트
  console.log('🎬 영화 차트...');
  const cpid = await uploadPhoto('/Users/aaron/.openclaw/workspace/memory/movie_chart.png');
  const curl = await getImageUrl(cpid);
  
  const igr = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: curl, caption: chartCaption, access_token: TOKEN }),
  });
  const igd = await igr.json();
  await sleep(8000);
  const igp = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: igd.id, access_token: TOKEN }),
  });
  const igpd = await igp.json();
  console.log('  IG:', igpd.id ? '✅ '+igpd.id : '❌ '+JSON.stringify(igpd));

  const fbr = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: chartCaption, attached_media: [{media_fbid: cpid}], access_token: TOKEN }),
  });
  const fbd = await fbr.json();
  console.log('  FB:', fbd.id ? '✅ '+fbd.id : '❌ '+JSON.stringify(fbd));
  await sleep(5000);

  // 2. 맛집 캐러셀
  console.log('\n🍽️ 맛집 캐러셀...');
  const foodFiles = [0,1,2,3,4,5,6].map(i => `/Users/aaron/.openclaw/workspace/memory/food_${i}.png`);
  const foodIds = []; const foodUrls = [];
  for (const f of foodFiles) {
    const pid = await uploadPhoto(f);
    const url = await getImageUrl(pid);
    foodIds.push(pid); foodUrls.push(url);
    process.stdout.write('.');
    await sleep(1500);
  }
  
  const igChildren = [];
  for (const url of foodUrls) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: TOKEN }),
    });
    const d = await r.json();
    igChildren.push(d.id);
    await sleep(2000);
  }
  await sleep(6000);
  
  const car = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ media_type:'CAROUSEL', children: igChildren.join(','), caption: foodCaption, access_token: TOKEN }),
  });
  const carD = await car.json();
  await sleep(8000);
  
  const pub = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: carD.id, access_token: TOKEN }),
  });
  const pubD = await pub.json();
  console.log('\n  IG:', pubD.id ? '✅ '+pubD.id : '❌ '+JSON.stringify(pubD));

  const fb2 = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: foodCaption, attached_media: foodIds.map(id=>({media_fbid:id})), access_token: TOKEN }),
  });
  const fb2D = await fb2.json();
  console.log('  FB:', fb2D.id ? '✅ '+fb2D.id : '❌ '+JSON.stringify(fb2D));
  
  console.log('\n🎉 완료!');
})();
