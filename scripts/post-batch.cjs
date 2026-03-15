const fs = require('fs');
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
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method:'POST', body:form });
  const d = await r.json();
  if (!d.id) throw new Error(JSON.stringify(d));
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
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: url, caption, access_token: TOKEN }),
  });
  const igD = await igM.json();
  await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: igD.id, access_token: TOKEN }),
  });
  const igPD = await igP.json();
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: caption, attached_media:[{media_fbid:pid}], access_token: TOKEN }),
  });
  const fbD = await fbR.json();
  return { ig: igPD.id, fb: fbD.id };
}
async function postCarousel(files, caption) {
  const pids = []; const urls = [];
  for (const f of files) {
    const pid = await uploadPhoto(f); urls.push(await getUrl(pid)); pids.push(pid);
    await sleep(1500);
  }
  const children = [];
  for (const url of urls) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ image_url: url, is_carousel_item:true, access_token: TOKEN }),
    });
    const d = await r.json(); children.push(d.id); await sleep(2000);
  }
  await sleep(5000);
  const car = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ media_type:'CAROUSEL', children:children.join(','), caption, access_token: TOKEN }),
  });
  const carD = await car.json();
  await sleep(8000);
  const pub = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: carD.id, access_token: TOKEN }),
  });
  const pubD = await pub.json();
  const fb = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: caption, attached_media: pids.map(id=>({media_fbid:id})), access_token: TOKEN }),
  });
  const fbD = await fb.json();
  return { ig: pubD.id, fb: fbD.id };
}

const MEM = '/Users/aaron/.openclaw/workspace/memory';

(async () => {
  // 1. She Nail Bar
  console.log('💅 She Nail Bar...');
  const r1 = await postSingle(`${MEM}/spotlight_nail.png`, `💅 이주의 달라스 업소 스팟라이트!

✨ @shenailbartx — She Nail Bar
📍 Dallas, TX

⭐ 5.0 별점 · 리뷰 797개
달라스 한인 No.1 네일샵 💅

젤네일 · 아크릴 · 네일아트 전문
📞 (214) 613-2030
🌐 shenailbartx.com

👉 달커넥트에서 더 많은 DFW 한인 업소 찾기
dalkonnect.com/businesses

#달라스네일 #달라스네일샵 #SheNailBar #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDallas #달라스미용 #재미교포 #달라스뷰티`);
  console.log(`  IG: ✅ ${r1.ig} | FB: ✅ ${r1.fb}`);
  await sleep(5000);

  // 2. SaySmile 치과
  console.log('🦷 SaySmile Dental...');
  const r2 = await postSingle(`${MEM}/spotlight_dental.png`, `🦷 이주의 달라스 업소 스팟라이트!

✨ @saysmiledental — SaySmile Dental
📍 Frisco, TX · Nuri Kim, DDS (한인 원장)

⭐ 5.0 별점 · 리뷰 239개
한국어 가능한 DFW 치과 🏆

일반 치과 · 임플란트 · 미백 · 교정
📞 (972) 525-4900
🌐 saysmiledental.com

👉 달커넥트에서 DFW 한인 병원/치과 찾기
dalkonnect.com/businesses

#달라스치과 #한인치과 #SaySmile #Frisco치과 #달라스한인 #DFW한인 #달커넥트 #DalKonnect #KoreanDentist #재미교포 #달라스병원`);
  console.log(`  IG: ✅ ${r2.ig} | FB: ✅ ${r2.fb}`);
  await sleep(5000);

  // 3. 달라스 꿀팁 2편
  console.log('💡 꿀팁 2편 캐러셀...');
  const tipFiles = [0,1,2,3,4,5].map(i => `${MEM}/tip3_${i}.png`);
  const r3 = await postCarousel(tipFiles, `💡 달라스 한인 생활 꿀팁 2편!

달라스에서 더 스마트하게 사는 법 👆 슬라이드 넘겨보세요!

🗣️ 영어 못해도 달라스에서 살 수 있어요
🏥 병원 & 보험 이렇게 활용하세요
🚗 텍사스 운전면허 빨리 따는 법
🛒 달라스 쇼핑 스마트하게 하는 법

👉 더 많은 DFW 한인 정보: dalkonnect.com
📱 저장하고 주변에 공유해주세요!

#달라스꿀팁 #달라스한인 #DFW한인 #달라스생활 #달라스이민 #달커넥트 #DalKonnect #텍사스한인 #KoreanDallas #재미교포 #달라스정착 #달라스정보`);
  console.log(`  IG: ✅ ${r3.ig} | FB: ✅ ${r3.fb}`);

  console.log('\n🎉 3개 전부 완료!');
})();
