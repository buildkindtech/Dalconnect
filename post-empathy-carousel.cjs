const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function nodeFetch(url, opts) {
  const { default: f } = await import('node-fetch');
  return f(url, opts);
}

require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const files = [1,2,3,4,5].map(i => `/Users/aaron/.openclaw/media/empathy-fix-${i}.png`);

const caption = `우리 딸, 마이짐 그만뒀어요 🧒

10개월부터 다닌 마이짐인데... 2.5세 반으로 올라가면서 서클 타임에 안 앉고, 협조도 안 하고, 그네 소유욕도 강해지고 결국 그만뒀습니다.

다른 애들은 다 잘 하는데 내 아이만 그런 것 같은 그 느낌... 비교하고 싶지 않아도 눈에 들어오고, 내가 뭘 잘못한 건지 미안한 마음까지 들잖아요.

근데 알고 보면 26개월이면 자기 주장 폭발하는 시기, 발달상 완전 정상이에요 🤍
맞지 않는 환경에서 과감히 빠지는 것도 좋은 육아 결정이에요.

비슷한 경험 있으신 분들 댓글로 나눠주세요 💬

👉 달커넥트 커뮤니티에서 더 많은 이야기를 만나보세요
dalkonnect.com/community

#달라스육아 #달라스맘 #달라스한인 #DFW육아 #달커넥트 #마이짐 #육아공감 #육아맘 #한인맘 #DalKonnect #달라스 #DFW`;

async function uploadToFB(filePath) {
  const form = new FormData();
  form.append('source', fs.createReadStream(filePath));
  form.append('published', 'false');
  form.append('access_token', FB_TOKEN);
  const r = await nodeFetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) throw new Error(`FB 업로드 실패: ${JSON.stringify(d)}`);
  const ur = await nodeFetch(`https://graph.facebook.com/v19.0/${d.id}?fields=images&access_token=${FB_TOKEN}`);
  const ud = await ur.json();
  const cdnUrl = ud.images?.[0]?.source;
  return cdnUrl;
}

async function main() {
  console.log('📤 5장 FB 업로드 중...');
  const containers = [];
  for (const file of files) {
    const cdnUrl = await uploadToFB(file);
    console.log('  ✅ CDN URL 획득:', file.split('/').pop());
    const cr = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: cdnUrl, is_carousel_item: true, access_token: FB_TOKEN }),
    });
    const cd = await cr.json();
    if (!cd.id) throw new Error(`컨테이너 생성 실패: ${JSON.stringify(cd)}`);
    containers.push(cd.id);
    console.log('  ✅ IG 컨테이너:', cd.id);
  }

  console.log('📱 캐러셀 생성 중...');
  const carouselRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: containers, caption, access_token: FB_TOKEN }),
  });
  const carouselData = await carouselRes.json();
  if (!carouselData.id) throw new Error(`캐러셀 생성 실패: ${JSON.stringify(carouselData)}`);

  await new Promise(r => setTimeout(r, 5000));

  const pubRes = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carouselData.id, access_token: FB_TOKEN }),
  });
  const pubData = await pubRes.json();
  if (pubData.id) console.log('🎉 캐러셀 포스팅 완료! ID:', pubData.id);
  else console.log('❌ 실패:', JSON.stringify(pubData));
}

main().catch(console.error);
