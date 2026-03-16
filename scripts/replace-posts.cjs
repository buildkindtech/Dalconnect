const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/node_modules/node-fetch/lib/index.js').then(({default: f}) => f(...args));
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = '1077704625421219';
const IG_ID = '17841440398453483';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 삭제할 기존 포스트
const DELETE_IG = ['18102585043904336','18012087530681243','17995612862866523','18571678351003341'];
const DELETE_FB = ['122100360213073369','122100360645073369','122100360741073369','122100364755073369'];

async function uploadPhoto(filePath) {
  const form = new FormData();
  form.append('source', fs.createReadStream(filePath));
  form.append('published', 'false');
  form.append('access_token', TOKEN);
  const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const d = await r.json();
  if (!d.id) throw new Error('Upload failed: ' + JSON.stringify(d));
  return d.id;
}

async function getUrl(pid) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${pid}?fields=images&access_token=${TOKEN}`);
  const d = await r.json();
  return d.images?.[0]?.source;
}

async function deletePosts() {
  console.log('\n🗑️  기존 포스트 삭제 중...');
  // IG 삭제
  for (const id of DELETE_IG) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${id}?access_token=${TOKEN}`, { method: 'DELETE' });
    const d = await r.json();
    console.log('  IG 삭제:', id, d.success ? '✅' : JSON.stringify(d));
    await sleep(1000);
  }
  // FB 삭제
  for (const id of DELETE_FB) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}_${id}?access_token=${TOKEN}`, { method: 'DELETE' });
    const d = await r.json();
    console.log('  FB 삭제:', id, d.success ? '✅' : JSON.stringify(d));
    await sleep(1000);
  }
}

async function postSingle(file, caption) {
  const pid = await uploadPhoto(file);
  const url = await getUrl(pid);
  // IG
  const igM = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: url, caption, access_token: TOKEN }),
  });
  const igD = await igM.json();
  await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: igD.id, access_token: TOKEN }),
  });
  const igPD = await igP.json();
  // FB
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: caption, attached_media: [{ media_fbid: pid }], access_token: TOKEN }),
  });
  const fbD = await fbR.json();
  console.log('  IG:', igPD.id || JSON.stringify(igPD), '| FB:', fbD.id || JSON.stringify(fbD));
}

async function postCarousel(files, caption) {
  const pids = [], urls = [];
  for (const f of files) {
    const pid = await uploadPhoto(f);
    urls.push(await getUrl(pid));
    pids.push(pid);
    await sleep(1500);
  }
  const children = [];
  for (const url of urls) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: TOKEN }),
    });
    const d = await r.json();
    children.push(d.id);
    await sleep(2000);
  }
  const carousel = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: children.join(','), caption, access_token: TOKEN }),
  });
  const carD = await carousel.json();
  await sleep(8000);
  const pub = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carD.id, access_token: TOKEN }),
  });
  const pubD = await pub.json();
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: caption, attached_media: pids.map(id => ({ media_fbid: id })), access_token: TOKEN }),
  });
  const fbD = await fbR.json();
  console.log('  IG 캐러셀:', pubD.id || JSON.stringify(pubD), '| FB:', fbD.id || JSON.stringify(fbD));
}

const CENTERED = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/news-centered';
const EYE_V2 = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/spotlight-eye-v2';

async function main() {
  await deletePosts();
  await sleep(2000);

  console.log('\n📤 뉴스 1/3: K-POP 빌보드');
  await postSingle(`${CENTERED}/kpop.png`, `🎵 이번 주 빌보드를 한국이 휩쓸었다!\n\n에이티즈 "GOLDEN HOUR : Part.4" 4주 연속 1위 🏆\n엔하이픈 · 스트레이키즈 · BTS · 뉴진스 · 아이브 · 아일릿\n빌보드 월드 앨범 차트 상위권 대거 점령 🇰🇷\n\n📰 더 많은 뉴스 → dalkonnect.com/news\n\n#달커넥트 #KPOP #에이티즈 #ATEEZ #빌보드 #달라스한인 #DFW한인`);
  await sleep(15000);

  console.log('\n📤 뉴스 2/3: F1 취소');
  await postSingle(`${CENTERED}/f1.png`, `⚡ 미이란 전쟁이 스포츠와 일상까지 덮쳤습니다\n\n🏎️ F1 사우디·바레인 대회 취소\n⚽ UEFA 피날리시마 2026 (카타르) 취소\n✈️ 4월 항공 유류할증료 10만원 이상 급등 예고\n\n📰 자세한 내용 → dalkonnect.com/news\n\n#달커넥트 #이란전쟁 #F1취소 #항공요금 #달라스한인 #DFW한인 #국제뉴스`);
  await sleep(15000);

  console.log('\n📤 뉴스 3/3: 호르무즈');
  await postSingle(`${CENTERED}/hormuz.png`, `🌏 트럼프, 한국 등 5개국에 호르무즈 군함 파견 요청\n\n트루스소셜을 통해 한·중·일·영·프랑스에 공식 요청\n이란의 호르무즈 해협 봉쇄 시도 → 국제유가 급등\n5개국 모두 "신중히 검토 중" 입장\n\n📰 자세한 내용 → dalkonnect.com/news\n\n#달커넥트 #호르무즈 #이란전쟁 #한국외교 #달라스한인 #DFW한인 #국제뉴스`);
  await sleep(15000);

  console.log('\n📤 김상우 안과 스팟라이트 (캐러셀)');
  const eyeSlides = [0,1,2,3,4].map(i => `${EYE_V2}/slide-0${i === 4 ? 4 : i}-${i === 0 ? 'cover' : i === 4 ? 'cta' : 'review'}.png`);
  await postCarousel(eyeSlides, `✨ 업체 스팟라이트 — 김상우 안과\n\nDFW 한인 안과 전문의 Ryan S. Kim, M.D.\n⭐ Google 5.0 만점 · 88개 리뷰\n\n🔹 수술 안과 전문의\n🔹 한국어 상담 가능\n🔹 주말 진료 가능\n\n📍 3425 Grande Bulevar Blvd, Irving TX\n📞 (972) 639-5836\n\n달커넥트에 등록된 DFW 한인 우수 업체를 소개합니다 🙌\n👉 dalkonnect.com/businesses\n\n#달커넥트 #DFW한인 #달라스한인 #한인안과 #김상우안과 #Irving #업체스팟라이트`);

  console.log('\n🎉 모두 교체 완료!');
}
main().catch(console.error);
