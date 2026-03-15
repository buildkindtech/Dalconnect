const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const caption = `📸 이주의 달라스 업소 스팟라이트!

✨ @clickittexas — Clickit Self-photo Studio
📍 Carrollton, TX

⭐ 5.0 별점 · 리뷰 1,435개
달라스 No.1 셀프 사진관 🏆

혼자서도, 친구들과도, 커플도 OK!
가족사진 · 생일 · 졸업 · 커플 · 패션 촬영

📞 (469) 444-0917
🌐 clickittexas.com

👉 달커넥트에서 더 많은 DFW 한인 업소 찾기
dalkonnect.com/businesses

#달라스사진관 #셀프사진관 #달라스한인 #DFW한인 #Carrollton #달커넥트 #DalKonnect #달라스데이트 #달라스커플 #KoreanDallas #DFWKorean #달라스맛집 #달라스생활 #재미교포`;

(async () => {
  console.log('📤 이미지 업로드...');
  const form = new FormData();
  form.append('source', fs.createReadStream('/Users/aaron/.openclaw/workspace/memory/spotlight_clickit.png'));
  form.append('published', 'false');
  form.append('access_token', TOKEN);
  const upRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const upData = await upRes.json();
  if (!upData.id) throw new Error(JSON.stringify(upData));
  
  const urlRes = await fetch(`https://graph.facebook.com/v19.0/${upData.id}?fields=images&access_token=${TOKEN}`);
  const urlData = await urlRes.json();
  const imageUrl = urlData.images?.[0]?.source;

  // IG 포스팅
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

  // FB 포스팅
  console.log('📘 FB 포스팅...');
  const fbRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ message: caption, attached_media: [{media_fbid: upData.id}], access_token: TOKEN }),
  });
  const fbD = await fbRes.json();
  console.log('  FB:', fbD.id ? '✅ '+fbD.id : '❌ '+JSON.stringify(fbD));
  console.log('\n🎉 완료!');
})();
