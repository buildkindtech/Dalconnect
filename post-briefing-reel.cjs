const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function nodeFetch(url, opts) {
  const { default: f } = await import('node-fetch');
  return f(url, opts);
}

const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const VIDEO_PATH = '/Users/aaron/.openclaw/media/briefing0323-reel.mp4';
const THUMB_PATH = '/Users/aaron/.openclaw/media/briefing0323-thumb.png';

const caption = `🎙️ 달라스 아침 브리핑 — 3월 23일 월요일

☁️ 오늘 달라스 날씨: 최고 69°F · 최저 60°F · 구름 조금

오늘의 주요 뉴스:
🏛️ DFW 공항 ICE 배치 앞두고 갈등 고조
🚗 알링턴 I-30 보복운전 총격 사건
📉 원/달러 환율 1,510원 돌파 — 17년 만에 최고
📦 한국 수출 역대 최대 — 반도체 164% 급증
🌊 이란 호르무즈 최후통첩 만료 임박
💊 운동 30분으로 청소년 당뇨 위험 감소

매일 아침 달라스 한인 커뮤니티 뉴스, 달커넥트에서 만나보세요 👇
dalkonnect.com

#달라스 #달라스한인 #DFW #달커넥트 #아침브리핑 #달라스뉴스 #한인뉴스 #DalKonnect #달라스생활 #텍사스한인`;

async function main() {
  console.log('📤 FB에 영상 업로드 중...');
  const form = new FormData();
  form.append('source', fs.createReadStream(VIDEO_PATH));
  form.append('published', 'false');
  form.append('access_token', FB_TOKEN);
  const r = await nodeFetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/videos`, { method: 'POST', body: form });
  const d = await r.json();
  console.log('FB 응답:', JSON.stringify(d));

  if (!d.id) { console.log('❌ FB 업로드 실패'); return; }

  console.log('⏳ 처리 대기 (30초)...');
  await new Promise(r => setTimeout(r, 30000));

  console.log('📱 IG 릴스 컨테이너 생성...');
  const cr = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: `https://graph.facebook.com/v19.0/${d.id}`,
      caption,
      share_to_feed: true,
      access_token: FB_TOKEN
    })
  });
  const cd = await cr.json();
  console.log('컨테이너:', JSON.stringify(cd));

  if (!cd.id) { console.log('❌ 컨테이너 실패'); return; }

  await new Promise(r => setTimeout(r, 10000));

  const pub = await nodeFetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: cd.id, access_token: FB_TOKEN })
  });
  const pd = await pub.json();
  if (pd.id) console.log('🎉 릴스 게시 완료! ID:', pd.id);
  else console.log('❌ 게시 실패:', JSON.stringify(pd));
}

main().catch(console.error);
