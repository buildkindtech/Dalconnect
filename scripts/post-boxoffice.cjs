const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const caption = `🎬 이번 주 한국 박스오피스 TOP 5!

1위 👑 왕과 사는 남자 (22만명)
2위 🔥 삼악도 (8,864명)
3위 🎬 F1 더 무비 (6,977명)
4위 🕵️ 휴민트 (4,308명)
5위 ⚔️ 극장판 진격의 거인 (4,225명)

이번 주 뭐 볼지 고민이라면? 👇
👉 dalkonnect.com/charts

#한국박스오피스 #한국영화 #영화차트 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #KoreanMovie #KoreanDallas #재미교포`;

(async () => {
  // 1. 구 포스트 삭제
  console.log('🗑️ 구 포스트 삭제...');
  const igDel = await fetch(`https://graph.facebook.com/v19.0/18130647067527787?access_token=${TOKEN}`, { method: 'DELETE' });
  console.log('  IG 삭제:', (await igDel.json()).success ? '✅' : '❌');
  const fbDel = await fetch(`https://graph.facebook.com/v19.0/122099107185073369?access_token=${TOKEN}`, { method: 'DELETE' });
  console.log('  FB 삭제:', (await fbDel.json()).success ? '✅' : '❌');
  await sleep(3000);

  // 2. 새 이미지 업로드
  console.log('📤 새 이미지 업로드...');
  const form = new FormData();
  form.append('source', fs.createReadStream('/Users/aaron/.openclaw/workspace/memory/boxoffice_chart.png'));
  form.append('published', 'false');
  form.append('access_token', TOKEN);
  const upRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const upData = await upRes.json();
  if (!upData.id) throw new Error(JSON.stringify(upData));
  console.log('  Photo ID:', upData.id);

  const urlRes = await fetch(`https://graph.facebook.com/v19.0/${upData.id}?fields=images&access_token=${TOKEN}`);
  const urlData = await urlRes.json();
  const imageUrl = urlData.images?.[0]?.source;

  // 3. IG 포스팅
  console.log('📱 IG 포스팅...');
  const igMedia = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: TOKEN }),
  });
  const igMd = await igMedia.json();
  await sleep(8000);
  const igPub = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: igMd.id, access_token: TOKEN }),
  });
  const igPd = await igPub.json();
  console.log('  IG:', igPd.id ? '✅ '+igPd.id : '❌ '+JSON.stringify(igPd));

  // 4. FB 포스팅
  console.log('📘 FB 포스팅...');
  const fbRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ message: caption, attached_media: [{media_fbid: upData.id}], access_token: TOKEN }),
  });
  const fbD = await fbRes.json();
  console.log('  FB:', fbD.id ? '✅ '+fbD.id : '❌ '+JSON.stringify(fbD));

  console.log('\n🎉 완료!');
})();
