const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219'; const IG_ID = '17841440398453483';
const MEM = '/Users/aaron/.openclaw/workspace/memory';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function upload(f) {
  const form = new FormData();
  form.append('source', fs.createReadStream(f));
  form.append('published','false'); form.append('access_token', TOKEN);
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, {method:'POST',body:form});
  const d = await r.json(); if(!d.id) throw new Error(JSON.stringify(d)); return d.id;
}
async function getUrl(pid) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${pid}?fields=images&access_token=${TOKEN}`);
  const d = await r.json(); return d.images?.[0]?.source;
}
async function postSingle(file, caption) {
  const pid = await upload(file); const url = await getUrl(pid);
  const igM = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_url:url,caption,access_token:TOKEN})});
  const igD = await igM.json(); await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({creation_id:igD.id,access_token:TOKEN})});
  const igPD = await igP.json();
  const fb = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:caption,attached_media:[{media_fbid:pid}],access_token:TOKEN})});
  const fbD = await fb.json();
  return {ig:igPD.id, fb:fbD.id};
}
async function postCarousel(files, caption) {
  const pids=[]; const urls=[];
  for(const f of files){const pid=await upload(f);urls.push(await getUrl(pid));pids.push(pid);await sleep(1500);}
  const children=[];
  for(const url of urls){
    const r=await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_url:url,is_carousel_item:true,access_token:TOKEN})});
    const d=await r.json();children.push(d.id);await sleep(2000);
  }
  await sleep(5000);
  const car=await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({media_type:'CAROUSEL',children:children.join(','),caption,access_token:TOKEN})});
  const carD=await car.json(); await sleep(8000);
  const pub=await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({creation_id:carD.id,access_token:TOKEN})});
  const pubD=await pub.json();
  const fb=await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:caption,attached_media:pids.map(id=>({media_fbid:id})),access_token:TOKEN})});
  const fbD=await fb.json();
  return {ig:pubD.id, fb:fbD.id};
}

(async () => {
  // 3. 자동차 TOP 5
  console.log('🚗 자동차...');
  const r3 = await postSingle(`${MEM}/car_top5.png`,
`🚗 달라스 한인 자동차샵 TOP 5!

달커넥트 리뷰 기반 최고 평점 자동차샵 모음 🔧

🥇 J Auto Solutions ⭐5.0 — Carrollton (리뷰 21개)
🥈 RIGHT AUTO REPAIR ⭐5.0 — Dallas
🥉 Autobahn Service Center ⭐4.9 — Plano (리뷰 264개)
4️⃣ Dallas European Collision ⭐4.9 — Dallas (리뷰 163개)
5️⃣ Japanese Autoworks ⭐4.9 — Euless (리뷰 151개)

차 수리 믿을 곳 찾고 계세요? 💪
👉 dalkonnect.com/businesses

#달라스자동차 #달라스정비 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDallas #달라스카샵 #재미교포 #자동차수리 #DFW자동차`);
  console.log(`  IG:✅${r3.ig} FB:✅${r3.fb}`); await sleep(5000);

  // 4. 세금 캐러셀 (6장)
  console.log('💸 세금...');
  const r4 = await postCarousel([0,1,2,3,4,5].map(i=>`${MEM}/tax_${i}.png`),
`💸 세금 신고 전 꼭 알아야 할 것들! (마감: 4월 15일 ‼️)

DFW 달라스 한인 분들을 위한 세금 꿀팁 👆 스와이프!

📅 Federal 마감: 2026년 4월 15일 (수)
💰 놓치기 쉬운 공제 항목들
🏠 주택 관련 세금 혜택
👨‍💼 한인 CPA TOP 5 추천 포함!

저장하고 4월 전에 준비하세요! 💪

👉 달커넥트에서 한인 세무사/법무사 찾기
dalkonnect.com/businesses

#달라스세금 #달라스CPA #세금신고 #택스시즌 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDallas #재미교포 #TaxSeason2026 #달라스세무사`);
  console.log(`  IG:✅${r4.ig} FB:✅${r4.fb}`); await sleep(5000);

  // 5. 부동산 캐러셀 (5장)
  console.log('🏡 부동산...');
  const r5 = await postCarousel([0,1,2,3,4].map(i=>`${MEM}/re_${i}.png`),
`🏡 달라스에서 집 구할 때 꼭 알아야 할 것들!

DFW 달라스 한인 부동산 완벽 가이드 👆 스와이프!

🏠 렌트 vs 구매 — 내 상황에 맞는 선택은?
💳 신용점수 얼마나 필요해요?
📍 학군별 집값 비교 (Frisco/Plano/Carrollton)
🤝 한인 부동산 에이전트 TOP 5 추천!

전원 한국어 상담 가능 · 달커넥트 리뷰 기반 🇰🇷

저장하고 집 알아볼 때 참고하세요!
👉 dalkonnect.com/businesses

#달라스부동산 #달라스한인부동산 #DFW부동산 #달라스집 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDallas #재미교포 #달라스이사 #Frisco부동산`);
  console.log(`  IG:✅${r5.ig} FB:✅${r5.fb}`);

  console.log('\n🎉 3,4,5 완료!');
})();
