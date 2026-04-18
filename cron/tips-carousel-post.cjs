#!/usr/bin/env node
/**
 * DalKonnect 꿀팁 캐러셀 IG+FB 포스팅
 * 사용법: node tips-carousel-post.cjs [YYYY-MM-DD]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';
const IG_ID = '17841440398453483';
const PAGE_ID = '1077704625421219';

const dateArg = process.argv[2] || new Date().toISOString().slice(0, 10);
const mmdd = dateArg.slice(5).replace('-', '');
const OUT_DIR = path.join('/tmp', `tips-${mmdd}`);
const MEM_DIR = path.join(BASE, 'memory', 'tips-carousel', dateArg);
const CONFIG_PATH = path.join(MEM_DIR, 'config.json');

if (!fs.existsSync(CONFIG_PATH)) { console.error('❌ config.json 없음:', CONFIG_PATH); process.exit(1); }
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const envLocal = fs.readFileSync(path.join(BASE, '.env.local'), 'utf8');
const TOKEN = envLocal.match(/FACEBOOK_PAGE_ACCESS_TOKEN=(.+)/)?.[1]?.trim();
if (!TOKEN) { console.error('❌ TOKEN 없음'); process.exit(1); }

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.join(BASE, 'konnect-firebase-key.json'))),
    storageBucket: 'konnect-ceedb.firebasestorage.app',
  });
}
const bucket = admin.storage().bucket();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sendTelegram(text) {
  const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); });
    req.on('error', rej); req.write(body); req.end();
  });
}

async function uploadSlide(filePath, name) {
  await bucket.upload(filePath, {
    destination: `tips/${name}`,
    metadata: { contentType: 'image/jpeg' },
  });
  const [url] = await bucket.file(`tips/${name}`).getSignedUrl({
    action: 'read', expires: Date.now() + 24 * 60 * 60 * 1000,
  });
  return url;
}

async function main() {
  const slides = config.slides || [];
  if (!slides.length) throw new Error('슬라이드 경로 없음');

  // Firebase 업로드
  console.log('Firebase 업로드 중...');
  const urls = [];
  for (let i = 0; i < slides.length; i++) {
    const url = await uploadSlide(slides[i], `tips-${dateArg}-slide${i + 1}.jpg`);
    urls.push(url);
    console.log(`  슬라이드 ${i + 1}/${slides.length} ✅`);
  }

  // IG 캐러셀
  console.log('📸 IG 캐러셀 생성 중...');
  const itemIds = [];
  for (const url of urls) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: TOKEN }),
    });
    const d = await res.json();
    if (!d.id) throw new Error('IG 아이템 실패: ' + JSON.stringify(d));
    itemIds.push(d.id);
    await sleep(800);
  }

  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: itemIds.join(','),
      caption: config.caption,
      access_token: TOKEN,
    }),
  });
  const container = await containerRes.json();
  if (!container.id) throw new Error('IG 컨테이너 실패: ' + JSON.stringify(container));

  await sleep(3000);
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: TOKEN }),
  });
  const pub = await publishRes.json();
  if (!pub.id) throw new Error('IG 게시 실패: ' + JSON.stringify(pub));
  console.log('✅ IG 포스팅:', pub.id);

  // FB 포스팅 (첫 슬라이드 이미지 + 캡션)
  console.log('📘 FB 포스팅 중...');
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('url', urls[0]);
  form.append('caption', config.caption);
  form.append('access_token', TOKEN);
  const fbRes = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, {
    method: 'POST', body: form, headers: form.getHeaders(),
  });
  const fbData = await fbRes.json();
  console.log('✅ FB 포스팅:', fbData.id || JSON.stringify(fbData));

  await sendTelegram(
    `✅ <b>꿀팁 캐러셀 포스팅 완료!</b>\n\n` +
    `${config.emoji} ${config.topic}\n\n` +
    `📸 IG: <code>${pub.id}</code>\n` +
    `📘 FB: <code>${fbData.id || '?'}</code>`
  );
  console.log('✅ 완료');
}

main().catch(async e => {
  console.error('❌', e.message);
  await sendTelegram(`❌ 꿀팁 캐러셀 포스팅 실패: ${e.message}`).catch(() => {});
  process.exit(1);
});
