const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219'; const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const caption = `🎵 이번 주 멜론 차트 TOP 5!

1위 🏆 BANG BANG — 404 (New Era)
2위 🔥 RUDE! — Drowning
3위 💜 사랑하게 될 거야 — BLACKHOLE
4위 ✨ Good Goodbye — GO
5위 🎶 0+0 — Blue Valentine

이번 주 뭐 들을지 고민이라면? 👇
👉 dalkonnect.com/charts

#멜론차트 #KPop #케이팝 #달커넥트 #DalKonnect #달라스한인 #DFW한인 #KoreanMusic #KoreanDallas #재미교포 #한국음악 #케이팝차트`;
(async () => {
  const form = new FormData();
  form.append('source', fs.createReadStream('/Users/aaron/.openclaw/workspace/memory/music_chart.png'));
  form.append('published', 'false'); form.append('access_token', TOKEN);
  const up = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method:'POST', body:form });
  const upD = await up.json();
  const urlR = await fetch(`https://graph.facebook.com/v19.0/${upD.id}?fields=images&access_token=${TOKEN}`);
  const urlD = await urlR.json();
  const url = urlD.images?.[0]?.source;
  const igM = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: url, caption, access_token: TOKEN }),
  });
  const igMD = await igM.json();
  await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: igMD.id, access_token: TOKEN }),
  });
  const igPD = await igP.json();
  console.log('IG:', igPD.id ? '✅ '+igPD.id : '❌ '+JSON.stringify(igPD));
  const fb = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: caption, attached_media:[{media_fbid:upD.id}], access_token: TOKEN }),
  });
  const fbD = await fb.json();
  console.log('FB:', fbD.id ? '✅ '+fbD.id : '❌ '+JSON.stringify(fbD));
})();
