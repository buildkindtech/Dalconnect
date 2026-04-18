#!/usr/bin/env node
/**
 * 달커넥트 콘텐츠 유니버설 트래커
 * 매일 8:30am — IG 전체 포스트 메트릭 수집 + 팔로워 스냅샷
 *
 * 저장:
 *   data/content-performance.json  — 포스트별 reach/saves/shares/comments
 *   data/growth-history.json        — 일별 팔로워 스냅샷
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID   = '-5280678324';
const IG_ID     = '17841440398453483';

const envLocal = fs.readFileSync(path.join(BASE, '.env.local'), 'utf8');
const TOKEN = envLocal.match(/FACEBOOK_PAGE_ACCESS_TOKEN=(.+)/)?.[1]?.trim();

const PERF_FILE   = path.join(BASE, 'data', 'content-performance.json');
const GROWTH_FILE = path.join(BASE, 'data', 'growth-history.json');

function load(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}
function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function sendTelegram(text) {
  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', resolve); });
    req.on('error', resolve);
    req.write(body); req.end();
  });
}

// 콘텐츠 타입 분류 (caption 기반)
function classifyContent(caption = '', mediaType = '') {
  const c = caption.toLowerCase();
  if (c.includes('아침 브리핑') || c.includes('morning')) return 'briefing';
  if (c.includes('업소') || c.includes('클로즈업') || c.includes('맛집') || c.includes('restaurant')) return 'closeup';
  if (c.includes('공감') || c.includes('힘들') || c.includes('이민') || c.includes('육아')) return 'empathy';
  if (c.includes('투표') || c.includes('poll') || c.includes('어떻게 생각')) return 'story_poll';
  if (c.includes('뉴스') || c.includes('news')) return 'news_card';
  if (mediaType === 'REEL' || mediaType === 'VIDEO') return 'reel';
  if (mediaType === 'CAROUSEL_ALBUM') return 'carousel';
  return 'other';
}

// IG 최근 포스트 목록 가져오기
async function fetchRecentPosts(limit = 30) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${IG_ID}/media?fields=id,media_type,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${TOKEN}`
  );
  const d = await res.json();
  return d.data || [];
}

// 개별 포스트 인사이트 가져오기 (릴/미디어)
async function fetchInsights(igId, mediaType) {
  // 릴은 plays 대신 reach만 (plays deprecated v22+)
  const metrics = 'reach,saved,shares';
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/insights?metric=${metrics}&access_token=${TOKEN}`
  );
  const d = await res.json();
  if (!d.data) return null;
  const m = {};
  d.data.forEach(x => {
    m[x.name] = x.values?.[0]?.value ?? x.value ?? 0;
  });
  return {
    reach: m.reach ?? 0,
    saves: m.saved ?? 0,
    shares: m.shares ?? 0,
  };
}

// IG 프로필 팔로워 수
async function fetchFollowers() {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${IG_ID}?fields=followers_count,media_count&access_token=${TOKEN}`
  );
  const d = await res.json();
  return { followers: d.followers_count ?? null, media_count: d.media_count ?? null };
}

async function main() {
  const perf = load(PERF_FILE);
  const growth = load(GROWTH_FILE);

  // ── 1. 팔로워 스냅샷 ────────────────────────────────────
  const { followers, media_count } = await fetchFollowers();
  const today = new Date().toISOString().slice(0, 10);
  if (followers !== null) {
    const prev = Object.values(growth).slice(-1)[0];
    const delta = prev?.followers ? followers - prev.followers : 0;
    growth[today] = {
      date: today,
      followers,
      media_count,
      delta,
      recorded_at: new Date().toISOString(),
    };
    save(GROWTH_FILE, growth);
    console.log(`👥 팔로워: ${followers} (${delta >= 0 ? '+' : ''}${delta})`);
  }

  // ── 2. 최근 포스트 메트릭 수집 ───────────────────────────
  const posts = await fetchRecentPosts(30);
  let updated = 0;
  let newPosts = 0;

  for (const post of posts) {
    const { id, media_type, caption, timestamp, like_count, comments_count } = post;

    // 이미 수집된 항목 중 24시간 미경과는 skip (급속 변화 구간)
    if (perf[id]?.reach_fetched_at) {
      const fetched = new Date(perf[id].reach_fetched_at).getTime();
      if (Date.now() - fetched < 20 * 60 * 60 * 1000) continue;
      // 1주일 이상 지난 것도 이미 완성된 것으로 간주
      if (Date.now() - fetched > 7 * 24 * 60 * 60 * 1000) continue;
    }

    const postedAt = new Date(timestamp).getTime();
    // 포스팅 후 6시간 미경과는 skip (아직 증가 중)
    if (Date.now() - postedAt < 6 * 60 * 60 * 1000) continue;

    const contentType = classifyContent(caption, media_type);

    // 기존 항목 없으면 신규
    if (!perf[id]) {
      newPosts++;
      perf[id] = {
        ig_id: id,
        media_type,
        content_type: contentType,
        caption: (caption || '').slice(0, 100),
        posted_at: timestamp,
        day_of_week: new Date(timestamp).getDay(),
        hour: new Date(timestamp).getHours(),
        like_count: like_count ?? 0,
        comments_count: comments_count ?? 0,
        reach: null, saves: null, shares: null,
        reach_fetched_at: null,
      };
    }

    // 메트릭 수집 (포스팅 후 6h~7d 범위)
    if (perf[id].reach === null || (Date.now() - postedAt < 7 * 24 * 60 * 60 * 1000)) {
      try {
        const insights = await fetchInsights(id, media_type);
        if (insights) {
          perf[id].reach = insights.reach;
          perf[id].saves = insights.saves;
          perf[id].shares = insights.shares;
          perf[id].like_count = like_count ?? perf[id].like_count;
          perf[id].comments_count = comments_count ?? perf[id].comments_count;
          perf[id].reach_fetched_at = new Date().toISOString();
          updated++;
          console.log(`  ✅ [${contentType}] ${id}: reach=${insights.reach} saves=${insights.saves} shares=${insights.shares}`);
        }
      } catch (e) {
        console.error(`  ⚠️ [${id}] 메트릭 실패:`, e.message);
      }
      // API rate limit 방지
      await new Promise(r => setTimeout(r, 500));
    }
  }

  save(PERF_FILE, perf);
  console.log(`✅ 콘텐츠 트래킹 완료: 신규 ${newPosts}개, 업데이트 ${updated}개`);

  // ── 3. 팔로워 변화 알림 (±2 이상일 때만) ──────────────────
  if (followers !== null && growth[today]?.delta && Math.abs(growth[today].delta) >= 2) {
    const d = growth[today].delta;
    const arrow = d > 0 ? '📈' : '📉';
    await sendTelegram(`${arrow} 팔로워 ${followers}명 (오늘 ${d > 0 ? '+' : ''}${d})`);
  }

  console.log('완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
