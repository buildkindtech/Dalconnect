const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219'; const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MEM = '/Users/aaron/.openclaw/workspace/memory';

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
  // 1. 소아과
  console.log('👶 소아과...');
  const r1 = await postSingle(`${MEM}/spotlight_peds.png`,
`👶 이주의 달라스 업소 스팟라이트!

✨ Sunny Hill Pediatrics
👩‍⚕️ Min Jung, MD — 한인 원장 🇰🇷
📍 Frisco, TX

⭐ 4.9 별점 · 리뷰 153개
한국어 가능 · DFW 한인 가족 추천 소아과

📞 (469) 530-9860
🌐 sunnyhillpediatrics.com

👉 달커넥트에서 DFW 한인 병원 찾기
dalkonnect.com/businesses

#달라스소아과 #한인소아과 #달라스육아 #Frisco소아과 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDallas #달라스맘 #육아 #재미교포`);
  console.log(`  IG:✅${r1.ig} FB:✅${r1.fb}`); await sleep(5000);

  // 2. 태권도 캐러셀
  console.log('🥋 태권도...');
  const r2 = await postCarousel([0,1,2,3,4,5].map(i=>`${MEM}/tkd_${i}.png`),
`🥋 DFW 달라스 한인 태권도장 TOP 5!

달커넥트 리뷰 기반 — 전부 ⭐5.0 최고 평점 🏆

🥇 Top Kick Martial Arts — Carrollton (리뷰 213개)
🥈 Championship Martial Arts — Coppell
🥉 Master Y Kim's Martial Arts — Frisco
4️⃣ Master Choi's Taekwondo — Wylie
5️⃣ Master Chang's Martial Arts — Coppell

아이 태권도 알아보고 계신 분들 저장해두세요! 💪

👉 dalkonnect.com/businesses

#달라스태권도 #DFW태권도 #한인태권도 #달라스육아 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #TaekwondoDallas #KoreanDallas #달라스아이들 #재미교포`);
  console.log(`  IG:✅${r2.ig} FB:✅${r2.fb}`); await sleep(5000);

  // 3. 육아 꿀팁 캐러셀
  console.log('👨‍👩‍👧 육아 꿀팁...');
  const r3 = await postCarousel([0,1,2,3,4,5].map(i=>`${MEM}/parenting_${i}.png`),
`👨‍👩‍👧 달라스에서 아이 키울 때 꼭 알아야 할 것들!

DFW 한인 부모님들을 위한 육아 꿀팁 모음 👆 슬라이드 넘겨보세요!

🏫 달라스 좋은 학군 고르는 법
🥋 한인 태권도장 찾는 법
👶 한인 소아과 추천
📚 한국어 교육 놓치지 않는 법

저장하고 달라스 한인 부모님들께 공유해주세요! 🙏

👉 더 많은 DFW 한인 정보: dalkonnect.com

#달라스육아 #달라스맘 #달라스한인 #DFW한인 #달라스아이들 #달커넥트 #DalKonnect #KoreanDallas #재미교포 #달라스학군 #DFW육아 #한인육아`);
  console.log(`  IG:✅${r3.ig} FB:✅${r3.fb}`);

  console.log('\n🎉 3개 전부 완료!');
})();
