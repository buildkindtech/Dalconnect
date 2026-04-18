const fs = require('fs');
const TOKEN = 'EAATGtEteKMYBQ5pwfbRNSRMCGYOsVeZAQ2qM2gINgrpHZBZAyXilxXjh6BO4esybUZBpSL3IilmQSJexBe5i1TIYC4JZB8PVdgYB3bd2UZCGW2Thv35jsYwDoYzrAw0SW9h3PIlcj2hc4w7ekzaZCvzC2XQETPCkOeMboKZAimkGGnleXfZBioI1Ag4m7xpU791pPXrELcJxE';
const IG_ID = '17841440398453483';
const FB_PAGE_ID = '1077704625421219';
const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const FIREBASE_KEY = `${BASE}/konnect-firebase-key.json`;

const CAPTION = `⛈️ 텍사스 폭풍 경보 — 주지사 비상대응 발동!

우박·토네이도·침수 주의보가 발령됐습니다.
달라스 한인 여러분, 대비하고 계신가요? 👇

🔦 비상키트 준비 완료!
🚗 차 대피 + 물 사놨어요
🤷 텍사스 날씨 뭐... 익숙해요
😰 폭풍? 지금 처음 알았어요

댓글로 알려주세요! 안전하게 대비하세요 🙏

#달커넥트 #텍사스폭풍 #달라스날씨 #DFW #텍사스날씨 #달라스한인 #DFWKorean #폭풍경보 #비상대응`;

(async () => {
  const fetch = (...a) => import('node-fetch').then(({default:f}) => f(...a));
  const admin = require(`${BASE}/node_modules/firebase-admin`);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(fs.readFileSync(FIREBASE_KEY,'utf8'))),
      storageBucket: 'konnect-ceedb.firebasestorage.app'
    });
  }

  // Firebase에서 이미 업로드된 파일 URL 재사용
  const [url] = await admin.storage().bucket().file('stories/story-poll-0410.png').getSignedUrl({
    action: 'read', expires: Date.now() + 3600*1000
  });
  console.log('✅ Firebase URL 획득');

  // IG 피드 포스트
  console.log('📸 IG 피드 컨테이너 생성...');
  const r1 = await fetch(`https://graph.facebook.com/v18.0/${IG_ID}/media`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: url, caption: CAPTION, access_token: TOKEN })
  });
  const d1 = await r1.json();
  if (!d1.id) { console.error('❌ IG 컨테이너 실패:', JSON.stringify(d1)); process.exit(1); }
  console.log('컨테이너:', d1.id);

  await new Promise(r => setTimeout(r, 4000));

  const r2 = await fetch(`https://graph.facebook.com/v18.0/${IG_ID}/media_publish`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: d1.id, access_token: TOKEN })
  });
  const d2 = await r2.json();
  if (!d2.id) { console.error('❌ IG 게시 실패:', JSON.stringify(d2)); process.exit(1); }
  console.log('✅ IG 피드 게시 완료! ID:', d2.id);

  // FB 페이지 포스트
  console.log('📘 FB 포스트...');
  const FormData = require(`${BASE}/node_modules/form-data`);
  const form = new FormData();
  form.append('url', url);
  form.append('caption', CAPTION);
  form.append('access_token', TOKEN);
  const r3 = await fetch(`https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`, {
    method:'POST', body: form
  });
  const d3 = await r3.json();
  if (!d3.id) { console.error('❌ FB 실패:', JSON.stringify(d3)); }
  else console.log('✅ FB 포스트 완료! ID:', d3.id);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
