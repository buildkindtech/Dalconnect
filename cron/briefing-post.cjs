#!/usr/bin/env node
/**
 * 아침 브리핑 Phase 3c — 제너릭 포스터
 *
 * 사용법:
 *   node briefing-post.cjs YYYY-MM-DD
 *
 * 요구 파일:
 *   memory/morning-reels/YYYY-MM-DD/briefing-config.json
 *   memory/morning-reels/YYYY-MM-DD/news-briefing-MMDD.mp4
 *   memory/morning-reels/YYYY-MM-DD/thumbnail.jpg
 *
 * Firebase 업로드 → IG Reel + FB Video 포스팅
 * Telegram으로 결과 알림
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const admin = require('firebase-admin');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';
const IG_ID = '17841440398453483';
const PAGE_ID = '1077704625421219';

// ─── 인수 ─────────────────────────────────────────────────
const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node briefing-post.cjs YYYY-MM-DD');
  process.exit(1);
}

const DATE_DIR = path.join(BASE, 'memory', 'morning-reels', dateArg);
const CONFIG_PATH = path.join(DATE_DIR, 'briefing-config.json');
const mmdd = dateArg.slice(5).replace('-', '');
const VIDEO_PATH = path.join(DATE_DIR, `news-briefing-${mmdd}.mp4`);
const THUMB_PATH = path.join(DATE_DIR, 'thumbnail.png');
const THUMB_JPG = path.join(DATE_DIR, 'thumbnail.jpg');

// 검증
for (const f of [CONFIG_PATH, VIDEO_PATH]) {
  if (!fs.existsSync(f)) {
    console.error(`❌ 파일 없음: ${f}`);
    process.exit(1);
  }
}
const thumbFile = fs.existsSync(THUMB_JPG) ? THUMB_JPG : THUMB_PATH;

// 설정 로드
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const envLocal = fs.readFileSync(path.join(BASE, '.env.local'), 'utf8');
const TOKEN = envLocal.match(/DALKONNECT_FB_PAGE_TOKEN=(.+)/)?.[1]?.trim()
  || envLocal.match(/FACEBOOK_PAGE_ACCESS_TOKEN=(.+)/)?.[1]?.trim();
if (!TOKEN) { console.error('❌ FB PAGE TOKEN 없음'); process.exit(1); }

// Firebase 초기화
if (!admin.apps.length) {
  const serviceAccount = require(path.join(BASE, 'konnect-firebase-key.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'konnect-ceedb.firebasestorage.app',
  });
}
const bucket = admin.storage().bucket();

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── 유틸 ─────────────────────────────────────────────────
function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function uploadToFirebase(filePath, destName) {
  const mime = destName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
  console.log(`Firebase 업로드: ${destName}`);
  await bucket.upload(filePath, {
    destination: `reels/${destName}`,
    metadata: { contentType: mime },
  });
  const file = bucket.file(`reels/${destName}`);
  const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 24 * 60 * 60 * 1000 });
  return url;
}

async function postToIG(videoUrl, thumbUrl) {
  console.log('📸 IG 릴 생성 중...');
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      cover_url: thumbUrl,
      caption: config.caption,
      share_to_feed: true,
      access_token: TOKEN,
    }),
  });
  const container = await containerRes.json();
  if (!container.id) throw new Error('IG 컨테이너 생성 실패: ' + JSON.stringify(container));
  console.log('  컨테이너 ID:', container.id);

  // 처리 대기
  for (let i = 0; i < 18; i++) {
    await sleep(10000);
    const statusRes = await fetch(`https://graph.facebook.com/v19.0/${container.id}?fields=status_code&access_token=${TOKEN}`);
    const status = await statusRes.json();
    console.log(`  IG 처리 ${(i + 1) * 10}s:`, status.status_code);
    if (status.status_code === 'FINISHED') break;
    if (status.status_code === 'ERROR') throw new Error('IG 처리 오류: ' + JSON.stringify(status));
  }

  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: TOKEN }),
  });
  const published = await publishRes.json();
  if (!published.id) throw new Error('IG 게시 실패: ' + JSON.stringify(published));
  return published.id;
}

async function postToFB(videoPath, thumbPath) {
  console.log('📘 FB 업로드 중...');
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('source', fs.createReadStream(videoPath));
  form.append('thumb', fs.createReadStream(thumbPath));
  form.append('description', config.caption);
  form.append('access_token', TOKEN);
  const res = await fetch(`https://graph-video.facebook.com/v19.0/${PAGE_ID}/videos`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  const data = await res.json();
  if (!data.id) throw new Error('FB 게시 실패: ' + JSON.stringify(data));
  return data.id;
}

// ─── 메인 ─────────────────────────────────────────────────
async function main() {
  const videoName = `briefing-${dateArg}.mp4`;
  const thumbName = `briefing-${dateArg}-thumb.jpg`;

  // Firebase 업로드
  const [videoUrl, thumbUrl] = await Promise.all([
    uploadToFirebase(VIDEO_PATH, videoName),
    uploadToFirebase(thumbFile, thumbName),
  ]);
  console.log('✅ Firebase 업로드 완료');

  // IG + FB 포스팅
  let igId = '', fbId = '';
  try {
    igId = await postToIG(videoUrl, thumbUrl);
    console.log('✅ IG 게시:', igId);
  } catch (e) {
    console.error('❌ IG 실패:', e.message);
  }

  try {
    fbId = await postToFB(VIDEO_PATH, thumbFile);
    console.log('✅ FB 게시:', fbId);
  } catch (e) {
    console.error('❌ FB 실패:', e.message);
  }

  // ── 퍼포먼스 메타데이터 저장 ─────────────────────────────
  try {
    const perfFile = path.join(BASE, 'data', 'briefing-performance.json');
    const perf = fs.existsSync(perfFile) ? JSON.parse(fs.readFileSync(perfFile, 'utf8')) : {};
    const videoStat = fs.statSync(VIDEO_PATH);
    const { execSync } = require('child_process');
    let videoSec = 0;
    try {
      const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${VIDEO_PATH}"`, { encoding: 'utf8' }).trim();
      videoSec = Math.round(parseFloat(dur));
    } catch {}
    const d = new Date(dateArg);
    const selectedNews = fs.existsSync(path.join(DATE_DIR, 'selected-news.json'))
      ? JSON.parse(fs.readFileSync(path.join(DATE_DIR, 'selected-news.json'), 'utf8'))
      : [];
    perf[dateArg] = {
      date: dateArg,
      ig_id: igId || null,
      fb_id: fbId || null,
      posted_at_utc: new Date().toISOString(),
      day_of_week: d.getDay(),
      video_sec: videoSec,
      news_count: selectedNews.length,
      categories: selectedNews.map(n => n.category),
      news_titles: selectedNews.map(n => n.title?.slice(0, 40)),
      reach: null, saves: null, shares: null, fetched_at: null,
    };
    fs.mkdirSync(path.dirname(perfFile), { recursive: true });
    fs.writeFileSync(perfFile, JSON.stringify(perf, null, 2));
    console.log(`📊 퍼포먼스 메타데이터 저장 (${videoSec}초)`);
  } catch (e) {
    console.warn('⚠️ 메타데이터 저장 실패:', e.message);
  }

  // Telegram 알림
  const dateInfo = config.dateLabel || dateArg;
  const msg = `✅ <b>${dateInfo} 아침 브리핑 포스팅 완료!</b>\n\n` +
    (igId ? `📸 IG: <code>${igId}</code>\n` : '❌ IG 실패\n') +
    (fbId ? `📘 FB: <code>${fbId}</code>\n` : '❌ FB 실패\n') +
    `\n뉴스 ${(config.newsItems || []).length}개 · ${config.weather ? `최고 ${config.weather.maxC}°C` : ''}`;

  await sendTelegram(msg);
  console.log('\n✅ 포스팅 완료!');
}

main().catch(async (e) => {
  console.error('❌', e.message);
  await sendTelegram(`❌ 아침 브리핑 포스팅 실패: ${e.message}`).catch(() => {});
  process.exit(1);
});
