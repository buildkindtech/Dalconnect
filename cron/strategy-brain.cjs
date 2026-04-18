#!/usr/bin/env node
/**
 * 달커넥트 전략 브레인
 * 매주 일요일 9am — 콘텐츠 성과 분석 → 전략 결정 → 콘텐츠 생성에 자동 반영
 *
 * 저장:
 *   data/strategy.json  — 현재 전략 (콘텐츠 생성 스크립트들이 참조)
 *
 * 전략이 반영되는 곳:
 *   - briefing-auto-config.cjs : targetSec (영상 길이 조정)
 *   - news-candidates.cjs      : 성과 좋은 카테고리 가중치
 *   - daily-empathy-preview.cjs: 저장율 높은 테마 우선
 *   - biz-closeup.cjs          : 반응 좋은 업소 카테고리 우선
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { askAI } = require('./ai.cjs');

const BASE        = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const PERF_FILE   = path.join(BASE, 'data', 'content-performance.json');
const GROWTH_FILE = path.join(BASE, 'data', 'growth-history.json');
const BRIEF_PERF  = path.join(BASE, 'data', 'briefing-performance.json');
const STRATEGY    = path.join(BASE, 'data', 'strategy.json');
const BOT_TOKEN   = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID     = '-5280678324';

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_KO = {
  briefing: '아침브리핑',
  closeup: '업소클로즈업',
  empathy: '공감캐러셀',
  story_poll: 'IG스토리',
  news_card: '뉴스카드',
  reel: '릴',
  carousel: '캐러셀',
  other: '기타',
};

function load(file, def = {}) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; }
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

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
function saveRate(posts) {
  const withReach = posts.filter(p => p.reach > 0);
  if (!withReach.length) return 0;
  const rate = withReach.reduce((s, p) => s + (p.saves || 0) / p.reach, 0) / withReach.length;
  return Math.round(rate * 1000) / 10; // %
}

// ── 분석 엔진 ─────────────────────────────────────────────
function analyze() {
  const perf = load(PERF_FILE);
  const growth = load(GROWTH_FILE);
  const briefPerf = load(BRIEF_PERF);

  const posts = Object.values(perf).filter(p => p.reach !== null && p.reach !== undefined);

  if (posts.length < 5) {
    return null; // 데이터 부족
  }

  // 1. 콘텐츠 타입별 성과
  const byType = {};
  for (const p of posts) {
    const t = p.content_type || 'other';
    if (!byType[t]) byType[t] = [];
    byType[t].push(p);
  }

  const typeStats = {};
  for (const [type, typePosts] of Object.entries(byType)) {
    const reaches = typePosts.map(p => p.reach || 0);
    const saves   = typePosts.map(p => p.saves || 0);
    const shares  = typePosts.map(p => p.shares || 0);
    typeStats[type] = {
      count: typePosts.length,
      avg_reach: avg(reaches),
      avg_saves: avg(saves),
      avg_shares: avg(shares),
      save_rate: saveRate(typePosts),   // saves / reach %
      total_saves: saves.reduce((a, b) => a + b, 0),
    };
  }

  // 2. 요일별 최고 성과 타입
  const dayBestType = {};
  for (let d = 0; d < 7; d++) {
    const dayPosts = posts.filter(p => p.day_of_week === d);
    if (!dayPosts.length) continue;
    const best = dayPosts.sort((a, b) => (b.reach || 0) - (a.reach || 0))[0];
    dayBestType[d] = best.content_type;
  }

  // 3. 팔로워 성장 드라이버 (성장한 날 올린 콘텐츠 타입)
  const growthEntries = Object.values(growth).filter(g => g.delta > 0);
  const growthDrivers = {};
  for (const g of growthEntries) {
    const dayPosts = posts.filter(p => p.posted_at?.startsWith(g.date));
    for (const p of dayPosts) {
      growthDrivers[p.content_type] = (growthDrivers[p.content_type] || 0) + g.delta;
    }
  }
  const topGrowthDrivers = Object.entries(growthDrivers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // 4. 저장율 기반 팔로우 전환 콘텐츠 (saves = 나중에 팔로우 전환 높음)
  const saveRanking = Object.entries(typeStats)
    .filter(([, s]) => s.count >= 2)
    .sort((a, b) => b[1].save_rate - a[1].save_rate)
    .map(([type, s]) => ({ type, save_rate: s.save_rate, avg_reach: s.avg_reach }));

  // 5. 브리핑 최적 길이 (briefing-performance에서)
  const briefEntries = Object.values(briefPerf).filter(e => e.reach !== null);
  let targetBriefingSec = 157; // 현재 기본값
  if (briefEntries.length >= 3) {
    const buckets = { short: [], mid: [], long: [] };
    for (const e of briefEntries) {
      if (e.video_sec <= 90) buckets.short.push(e.reach);
      else if (e.video_sec <= 150) buckets.mid.push(e.reach);
      else buckets.long.push(e.reach);
    }
    const bestBucket = Object.entries(buckets)
      .filter(([, arr]) => arr.length)
      .sort((a, b) => avg(b[1]) - avg(a[1]))[0];
    if (bestBucket) {
      targetBriefingSec = bestBucket[0] === 'short' ? 90 : bestBucket[0] === 'mid' ? 140 : 160;
    }
  }

  // 6. 공감 콘텐츠 최고 테마
  const empathyPosts = posts.filter(p => p.content_type === 'empathy');
  // caption에서 테마 힌트 추출 (가족/육아/이민/달라스/직장)
  const empathyThemes = { '육아/가족': 0, '이민/비자': 0, '달라스생활': 0, '직장/사업': 0, '공감이야기': 0 };
  for (const p of empathyPosts) {
    const c = (p.caption || '').toLowerCase();
    const s = p.saves || 0;
    if (c.includes('아이') || c.includes('육아') || c.includes('가족')) empathyThemes['육아/가족'] += s;
    if (c.includes('비자') || c.includes('이민') || c.includes('영주권')) empathyThemes['이민/비자'] += s;
    if (c.includes('달라스') || c.includes('텍사스')) empathyThemes['달라스생활'] += s;
    if (c.includes('직장') || c.includes('사업') || c.includes('취업')) empathyThemes['직장/사업'] += s;
    else empathyThemes['공감이야기'] += s;
  }
  const topEmpathyThemes = Object.entries(empathyThemes)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

  // 7. 주간 콘텐츠 믹스 권장 (성과 기반)
  const weeklyMix = {
    briefing: 7,  // 매일 고정
    empathy: 7,   // 매일 고정
    story_poll: 7, // 매일 고정
    closeup: topGrowthDrivers.includes('closeup') ? 5 : 3,
    news_card: saveRanking.find(s => s.type === 'news_card')?.save_rate > 2 ? 5 : 3,
  };

  return {
    analyzed_at: new Date().toISOString(),
    sample_count: posts.length,
    type_stats: typeStats,
    day_best_type: dayBestType,
    top_growth_drivers: topGrowthDrivers,
    save_ranking: saveRanking,
    top_empathy_themes: topEmpathyThemes,
    targeting: {
      briefing_target_sec: targetBriefingSec,
      best_content_for_followers: saveRanking[0]?.type || 'empathy',
      best_content_for_reach: Object.entries(typeStats)
        .filter(([, s]) => s.count >= 2)
        .sort((a, b) => b[1].avg_reach - a[1].avg_reach)[0]?.[0] || 'briefing',
    },
    weekly_mix: weeklyMix,
  };
}

// ── 메인 ─────────────────────────────────────────────────
async function main() {
  console.log('[strategy-brain] 분석 시작...');

  const result = analyze();
  if (!result) {
    console.log('데이터 부족 (5개 미만) — 스킵');
    return;
  }

  save(STRATEGY, result);
  console.log('✅ strategy.json 저장 완료');

  // ── Telegram 전략 리포트 ─────────────────────────────
  const { type_stats, save_ranking, top_growth_drivers, targeting, weekly_mix } = result;

  let msg = `🧠 <b>이번 주 달커넥트 전략 리포트</b>\n\n`;
  msg += `📊 <b>콘텐츠 성과 순위</b> (저장율 = 팔로우 전환 지표)\n`;

  for (const { type, save_rate, avg_reach } of save_ranking.slice(0, 5)) {
    const ko = TYPE_KO[type] || type;
    msg += `  ${ko}: 도달 ${avg_reach} / 저장율 ${save_rate}%\n`;
  }

  if (top_growth_drivers.length) {
    msg += `\n📈 <b>팔로워 성장 드라이버</b>\n`;
    msg += top_growth_drivers.map(t => `  → ${TYPE_KO[t] || t}`).join('\n') + '\n';
  }

  msg += `\n🎯 <b>이번 주 전략</b>\n`;
  msg += `  팔로워 획득: <b>${TYPE_KO[targeting.best_content_for_followers] || targeting.best_content_for_followers}</b> 집중\n`;
  msg += `  도달 최적: <b>${TYPE_KO[targeting.best_content_for_reach] || targeting.best_content_for_reach}</b> 품질 유지\n`;
  msg += `  브리핑 목표: <b>${Math.floor(targeting.briefing_target_sec / 60)}분${targeting.briefing_target_sec % 60}초</b> 이하\n`;

  // Gemini로 실행 가능한 다음 주 액션 3가지 생성
  try {
    const statsStr = save_ranking.slice(0, 5)
      .map(s => `${TYPE_KO[s.type]}: 저장율${s.save_rate}% 도달${s.avg_reach}`).join(', ');
    const actionPrompt = `달커넥트(달라스 한인 커뮤니티 앱, IG 팔로워 ${result.sample_count}개 포스트 분석) 운영자에게 이번 주 실행할 콘텐츠 전략 3가지를 1줄씩 한국어로 제안해줘.
성과: ${statsStr}
팔로워 드라이버: ${top_growth_drivers.map(t => TYPE_KO[t]).join(', ')}
목표: IG 팔로워 증가 → 업소 광고주 유치
실행 가능하고 구체적으로. 각 줄 "→"로 시작.`;
    const actions = (await askAI(actionPrompt, { maxTokens: 200, thinkingBudget: 0 })).trim();
    msg += `\n💡 <b>이번 주 액션</b>\n${actions}`;
  } catch (e) {
    console.error('액션 생성 실패:', e.message);
  }

  msg += `\n\n<i>데이터 ${result.sample_count}개 포스트 기반</i>`;

  await sendTelegram(msg);
  console.log('✅ Telegram 전략 리포트 전송 완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
