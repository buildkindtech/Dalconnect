const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function nodeFetch(url, opts) {
  const { default: f } = await import('node-fetch');
  return f(url, opts);
}

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const filePath = process.argv[2];
const caption = process.argv[3] || '';

async function postSingle() {
  console.log('📤 FB 업로드 중...');
  const form = new FormData();
  form.append('source', fs.createReadStream(filePath));
  form.append('published', 'false');
  form.append('access_token', FB_TOKEN);
  const r = await nodeFetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) { console.log('❌ FB 업로드 실패:', d); return; }

  const ur = await nodeFetch(`https://graph.facebook.com/v19.0/${d.id}?fields=images&access_token=${FB_TOKEN}`);
  const ud = await ur.json();
  const cdnUrl = ud.images?.[0]?.source;
  console.log('✅ CDN URL 획득');

  console.log('📱 IG 컨테이너 생성...');
  const createRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: cdnUrl, caption, access_token: FB_TOKEN }),
  });
  const createData = await createRes.json();
  if (!createData.id) { console.log('❌ IG 컨테이너 실패:', createData); return; }

  await new Promise(r => setTimeout(r, 5000));

  const pubRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: createData.id, access_token: FB_TOKEN }),
  });
  const pubData = await pubRes.json();
  if (pubData.id) console.log('🎉 IG 포스팅 완료! ID:', pubData.id);
  else console.log('❌ IG 게시 실패:', pubData);
}

postSingle().catch(console.error);
