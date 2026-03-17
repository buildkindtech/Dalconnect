require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });
const fs = require('fs');
const https = require('https');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));

const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/sns-cards/posted';

function dlImg(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 400) { reject(new Error('HTTP '+res.statusCode)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function getAllPosts() {
  let url = `https://graph.facebook.com/v19.0/${IG_ID}/media?fields=id,timestamp,media_type,media_url,caption,children{media_url,timestamp}&limit=50&access_token=${TOKEN}`;
  const allPosts = [];
  while (url) {
    const r = await (await fetch)(url);
    const d = await r.json();
    if (d.data) allPosts.push(...d.data);
    url = d.paging?.next || null;
  }
  return allPosts;
}

(async () => {
  console.log('IG 포스팅 목록 가져오는 중...');
  const posts = await getAllPosts();
  console.log('총:', posts.length, '개');

  for (const post of posts) {
    const date = post.timestamp.substring(0, 10);
    const dir = `${BASE}/${date}`;
    fs.mkdirSync(dir, { recursive: true });

    // posts.json 업데이트
    const pFile = `${dir}/posts.json`;
    let existing = [];
    if (fs.existsSync(pFile)) try { existing = JSON.parse(fs.readFileSync(pFile,'utf8')); } catch {}
    if (existing.find(p => p.ig_id === post.id)) { process.stdout.write('·'); continue; }

    // 이미지 다운로드
    const savedImages = [];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data) {
      for (let i = 0; i < post.children.data.length; i++) {
        const child = post.children.data[i];
        if (!child.media_url) continue;
        const fname = `${post.id}_slide_${i}.jpg`;
        try {
          await dlImg(child.media_url, `${dir}/${fname}`);
          savedImages.push(fname);
        } catch(e) { console.log('\n이미지 실패:', e.message); }
      }
    } else if (post.media_url) {
      const fname = `${post.id}.jpg`;
      try {
        await dlImg(post.media_url, `${dir}/${fname}`);
        savedImages.push(fname);
      } catch(e) { console.log('\n이미지 실패:', e.message); }
    }

    const entry = {
      ig_id: post.id,
      date,
      type: post.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'single',
      ...(savedImages.length === 1 ? { image: savedImages[0] } : { images: savedImages }),
      caption: (post.caption || '').substring(0, 500),
      timestamp: post.timestamp
    };

    existing.push(entry);
    fs.writeFileSync(pFile, JSON.stringify(existing, null, 2));
    process.stdout.write('✅');
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n\n완료!');
  // 날짜별 요약
  const dirs = fs.readdirSync(BASE).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/)).sort();
  for (const d of dirs) {
    try {
      const p = JSON.parse(fs.readFileSync(`${BASE}/${d}/posts.json`,'utf8'));
      console.log(d, ':', p.length, '개');
    } catch {}
  }
})().catch(console.error);
