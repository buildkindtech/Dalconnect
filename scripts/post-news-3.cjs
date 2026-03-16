const fs = require('fs');
const FormData = require('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/node_modules/form-data');
const fetch = (...args) => import('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/node_modules/node-fetch/lib/index.js').then(({default: f}) => f(...args));
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

async function postSingle(filePath, caption) {
  console.log('  📤 업로드 중...');
  const pid = await uploadPhoto(filePath);
  const url = await getUrl(pid);
  console.log('  ✅ 업로드 완료');

  // Instagram
  console.log('  📸 Instagram 포스팅...');
  const igM = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: url, caption, access_token: TOKEN }),
  });
  const igD = await igM.json();
  if (!igD.id) { console.log('  ⚠️ IG media 생성 실패:', JSON.stringify(igD)); return; }
  await sleep(8000);
  const igP = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: igD.id, access_token: TOKEN }),
  });
  const igPD = await igP.json();
  console.log('  ✅ Instagram:', igPD.id || JSON.stringify(igPD));

  // Facebook
  console.log('  📘 Facebook 포스팅...');
  const fbR = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: caption, attached_media: [{ media_fbid: pid }], access_token: TOKEN }),
  });
  const fbD = await fbR.json();
  console.log('  ✅ Facebook:', fbD.id || JSON.stringify(fbD));
}

const posts = [
  {
    file: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/news-final/kpop.png',
    caption: `🎵 이번 주 빌보드를 한국이 휩쓸었다!

에이티즈 "GOLDEN HOUR : Part.4" 4주 연속 1위 🏆
엔하이픈 · 스트레이키즈 · BTS · 뉴진스 · 아이브 · 아일릿
빌보드 월드 앨범 차트 상위권 대거 점령 🇰🇷

K-POP의 글로벌 영향력, 멈출 기세가 없네요.

📰 더 많은 뉴스 → dalkonnect.com/news

#달커넥트 #KPOP #에이티즈 #ATEEZ #빌보드 #달라스한인 #DFW한인`,
  },
  {
    file: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/news-final/f1.png',
    caption: `⚡ 미이란 전쟁이 스포츠와 일상까지 덮쳤습니다

🏎️ F1 사우디·바레인 대회 취소
⚽ UEFA 피날리시마 2026 (카타르) 취소
✈️ 4월 항공 유류할증료 10만원 이상 급등 예고

국제유가 급등으로 여행 계획 있으신 분들은 미리 확인하세요.

📰 자세한 내용 → dalkonnect.com/news

#달커넥트 #이란전쟁 #F1취소 #항공요금 #달라스한인 #DFW한인 #국제뉴스`,
  },
  {
    file: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/news-final/hormuz.png',
    caption: `🌏 트럼프, 한국 등 5개국에 호르무즈 군함 파견 요청

트루스소셜을 통해 한·중·일·영·프랑스에 공식 요청
이란의 호르무즈 해협 봉쇄 시도 → 국제유가 급등
5개국 모두 "신중히 검토 중" 입장

전문가들: "좁은 해협에 군자산 배치는 큰 도박"

📰 자세한 내용 → dalkonnect.com/news

#달커넥트 #호르무즈 #이란전쟁 #한국외교 #달라스한인 #DFW한인 #국제뉴스`,
  },
];

async function main() {
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    console.log(`\n[${i+1}/3] ${p.caption.split('\n')[0]}`);
    try {
      await postSingle(p.file, p.caption);
    } catch(e) {
      console.error('  ❌ 오류:', e.message);
    }
    if (i < posts.length - 1) {
      console.log('  ⏳ 15초 대기...');
      await sleep(15000);
    }
  }
  console.log('\n🎉 모든 포스팅 완료!');
}
main().catch(console.error);
// NOT USED - see post-spotlight-eye.cjs
