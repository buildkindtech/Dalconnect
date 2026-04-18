#!/usr/bin/env node
/**
 * 아침 브리핑 퍼포먼스 트래커
 * 매일 8am 실행 — 전날 도달 자동 수집 + 분석 + Telegram 리포트
 * 분석 결과는 data/briefing-insights.json에 저장되어 다음 브리핑에 반영됨
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const PERF_FILE = path.join(BASE, 'data', 'briefing-performance.json');
const INSIGHTS_FILE = path.join(BASE, 'data', 'briefing-insights.json');
const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';

const envLocal = fs.readFileSync(path.join(BASE, '.env.local'), 'utf8');
const TOKEN = envLocal.match(/FACEBOOK_PAGE_ACCESS_TOKEN=(.+)/)?.[1]?.trim();

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function sendTelegram(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve()); });
    req.on('error', () => resolve());
    req.write(body); req.end();
  });
}

async function fetchReach(igId) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/insights?metric=reach,saved,shares&access_token=${TOKEN}`
  );
  const d = await res.json();
  const m = {};
  (d.data || []).forEach(x => { m[x.name] = x.values?.[0]?.value ?? x.value ?? 0; });
  return { reach: m.reach ?? null, saves: m.saved ?? 0, shares: m.shares ?? 0 };
}

function loadPerf() {
  try { return JSON.parse(fs.readFileSync(PERF_FILE, 'utf8')); } catch { return {}; }
}
function savePerf(data) {
  fs.mkdirSync(path.dirname(PERF_FILE), { recursive: true });
  fs.writeFileSync(PERF_FILE, JSON.stringify(data, null, 2));
}

// ── 인사이트 계산 ─────────────────────────────────────────
function calcInsights(perf) {
  const entries = Object.values(perf).filter(e => e.reach !== null);
  if (entries.length < 2) return null;

  // 요일별 평균 도달
  const byDay = {};
  for (const e of entries) {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e.reach);
  }
  const dayAvg = {};
  for (const [d, arr] of Object.entries(byDay)) {
    dayAvg[d] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  // 영상 길이 버킷별 평균 도달 (90s 이하 / 90-150s / 150s 이상)
  const buckets = { short: [], mid: [], long: [] };
  for (const e of entries) {
    if (e.video_sec <= 90) buckets.short.push(e.reach);
    else if (e.video_sec <= 150) buckets.mid.push(e.reach);
    else buckets.long.push(e.reach);
  }
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const lengthAvg = {
    short: avg(buckets.short),   // ~1:30 이하
    mid: avg(buckets.mid),       // 1:30~2:30
    long: avg(buckets.long),     // 2:30 이상
  };

  // 최적 영상 길이 (도달 가장 높은 버킷)
  const best = Object.entries(lengthAvg)
    .filter(([, v]) => v !== null)
    .sort((a, b) => b[1] - a[1])[0];
  const targetSec = best?.[0] === 'short' ? 90 : best?.[0] === 'mid' ? 140 : 160;

  // 최근 7일 평균
  const recent = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const recentAvg = avg(recent.map(e => e.reach));

  return { dayAvg, lengthAvg, targetSec, recentAvg, sampleCount: entries.length };
}

// ── 메인 ─────────────────────────────────────────────────
async function main() {
  const perf = loadPerf();
  const now = Date.now();
  const updated = [];

  // 도달 미수집 항목 업데이트 (포스팅 후 20시간 이상 경과)
  for (const [date, entry] of Object.entries(perf)) {
    if (entry.reach !== null) continue;
    if (!entry.ig_id) continue;
    const postedAt = new Date(entry.posted_at_utc).getTime();
    if (now - postedAt < 20 * 60 * 60 * 1000) continue;

    try {
      const { reach, saves, shares } = await fetchReach(entry.ig_id);
      if (reach !== null) {
        perf[date].reach = reach;
        perf[date].saves = saves;
        perf[date].shares = shares;
        perf[date].fetched_at = new Date().toISOString();
        updated.push({ date, reach, saves, shares, ...entry });
        console.log(`✅ [${date}] 도달 수집: ${reach}`);
      }
    } catch (e) {
      console.error(`⚠️ [${date}] 도달 수집 실패:`, e.message);
    }
  }

  savePerf(perf);

  // 인사이트 계산 + 저장
  const insights = calcInsights(perf);
  if (insights) {
    fs.mkdirSync(path.dirname(INSIGHTS_FILE), { recursive: true });
    fs.writeFileSync(INSIGHTS_FILE, JSON.stringify({ ...insights, updated_at: new Date().toISOString() }, null, 2));
    console.log('📊 인사이트 업데이트:', JSON.stringify(insights));
  }

  // Telegram 리포트 (업데이트된 항목 있을 때)
  if (updated.length > 0) {
    const allWithReach = Object.values(perf).filter(e => e.reach !== null).sort((a, b) => b.date?.localeCompare(a.date));
    const recent7 = allWithReach.slice(0, 7);
    const avg7 = recent7.length ? Math.round(recent7.reduce((s, e) => s + e.reach, 0) / recent7.length) : 0;

    let msg = `📊 <b>아침 브리핑 도달 리포트</b>\n\n`;

    for (const e of updated) {
      const dayStr = DAY_KO[e.day_of_week] || '';
      const minSec = `${Math.floor(e.video_sec / 60)}분${e.video_sec % 60}초`;
      const trend = e.reach >= avg7 ? '📈' : '📉';
      msg += `${trend} <b>${e.date}</b> (${dayStr}) — 도달 <b>${e.reach}</b>\n`;
      msg += `   영상 ${minSec} · 저장 ${e.saves} · 공유 ${e.shares}\n`;
    }

    if (insights && insights.sampleCount >= 3) {
      msg += `\n📐 <b>패턴 분석</b> (${insights.sampleCount}개 데이터)\n`;

      // 요일별 순위
      const dayRank = Object.entries(insights.dayAvg)
        .sort((a, b) => b[1] - a[1])
        .map(([d, v]) => `${DAY_KO[d]}(${v})`).join(' > ');
      msg += `요일: ${dayRank}\n`;

      // 길이별
      const lenParts = [];
      if (insights.lengthAvg.short) lenParts.push(`~1:30 = ${insights.lengthAvg.short}`);
      if (insights.lengthAvg.mid) lenParts.push(`1:30~2:30 = ${insights.lengthAvg.mid}`);
      if (insights.lengthAvg.long) lenParts.push(`2:30+ = ${insights.lengthAvg.long}`);
      if (lenParts.length) msg += `길이: ${lenParts.join(' / ')}\n`;

      msg += `→ 권장 목표: <b>${Math.floor(insights.targetSec / 60)}분${insights.targetSec % 60}초</b> 이하\n`;
      msg += `최근 7일 평균 도달: <b>${avg7}</b>`;
    }

    await sendTelegram(msg);
  } else {
    console.log('업데이트된 항목 없음');
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
