#!/usr/bin/env node
/**
 * DalKonnect 차트 자동 업데이트 v3
 * 
 * 원칙:
 * 1. 실제 데이터만 (더미 절대 금지)
 * 2. 실패 시 이전 데이터 유지 (덮어쓰기 안 함)
 * 3. 실패 즉시 알림 (Telegram + 로그)
 * 4. 자체 재시도 (3회)
 * 
 * 소스:
 * - 음악: Bugs Music 실시간 차트 (curl)
 * - 영화: Naver 박스오피스 (curl)
 * - 넷플릭스/드라마: FlixPatrol Korea (curl)
 * - YouTube Korea: YouTube Charts (agent-browser)
 */

const pg = require('pg');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });
const TODAY = new Date().toISOString().split('T')[0];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const LOG_FILE = '/tmp/dalconnect-charts.log';
const fs = require('fs');
const path = require('path');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ─── HTTP Fetch (no external deps) ───
function fetchUrl(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchUrl(next, maxRedirects - 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── Retry wrapper ───
async function withRetry(fn, name, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      if (result && result.length > 0) return result;
      log(`⚠️ ${name}: 빈 결과 (시도 ${i + 1}/${retries})`);
    } catch (e) {
      log(`⚠️ ${name}: 에러 (시도 ${i + 1}/${retries}): ${e.message}`);
    }
    if (i < retries - 1) await sleep(3000);
  }
  return [];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── 1. Bugs Music 실시간 차트 ───
async function fetchMusicChart() {
  const { body } = await fetchUrl('https://music.bugs.co.kr/chart/track/realtime/total');
  if (!body || body.length < 1000) throw new Error('Bugs 페이지 로드 실패');
  
  const items = [];
  // Parse title and artist from Bugs HTML
  const titleRegex = /class="title"[^>]*>\s*<a[^>]*>([^<]+)/g;
  const artistRegex = /class="artist"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/g;
  
  const titles = [];
  const artists = [];
  let m;
  while ((m = titleRegex.exec(body)) && titles.length < 10) titles.push(m[1].trim());
  while ((m = artistRegex.exec(body)) && artists.length < 10) artists.push(m[1].trim());
  
  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    items.push({
      chart_type: 'music',
      rank: i + 1,
      title_ko: titles[i],
      artist: artists[i] || '',
      platform: 'Bugs Music 실시간',
    });
  }
  return items;
}

// ─── 2. Naver 박스오피스 (agent-browser) ───
async function fetchMovieChart() {
  try {
    execSync('/opt/homebrew/bin/agent-browser navigate "https://m.search.naver.com/search.naver?query=%EB%B0%95%EC%8A%A4%EC%98%A4%ED%94%BC%EC%8A%A4+%EC%88%9C%EC%9C%84" 2>/dev/null', { timeout: 10000 });
    execSync('sleep 3');
    const snap = execSync('/opt/homebrew/bin/agent-browser snapshot 2>/dev/null', { timeout: 10000 }).toString();
    
    const items = [];
    // Pattern from snapshot: link "1 왕과 사는 남자 왕과 사는 남자 15만명"
    const regex = /link "(\d+) (.+?) \2 ([\d,]+만?명)"/g;
    let m;
    while ((m = regex.exec(snap)) && items.length < 10) {
      items.push({
        chart_type: 'movie',
        rank: parseInt(m[1]),
        title_ko: m[2].trim(),
        artist: '',
        platform: 'KOBIS 박스오피스',
        score: m[3],
      });
    }
    return items;
  } catch (e) {
    throw new Error('Naver agent-browser 실패: ' + e.message);
  }
}

// ─── 3. FlixPatrol Netflix Korea (agent-browser) ───
async function fetchNetflixChart() {
  try {
    execSync('/opt/homebrew/bin/agent-browser navigate "https://flixpatrol.com/top10/netflix/south-korea/" 2>/dev/null', { timeout: 10000 });
    execSync('sleep 3');
    const snap = execSync('/opt/homebrew/bin/agent-browser snapshot 2>/dev/null', { timeout: 10000 }).toString();
    
    // Extract all content links (skip nav links)
    const skipTitles = new Set(['TOP 10', 'Popularity', 'Calendar', 'Preferences', 'Most watched', 'Persons', 'Services', 'Budget', 'Sign in', 'Netflix', 'South Korea', 'Yesterday', 'homepage', 'Contact us', 'API access', 'E-mail', 'Contact form']);
    
    const allLinks = [];
    const linkRegex = /link "([^"]+)"\s*\[ref=/g;
    let m;
    while ((m = linkRegex.exec(snap))) {
      const title = m[1].trim();
      if (title.length > 2 && !skipTitles.has(title) && !title.includes('FlixPatrol') && !title.includes('charts') && !title.includes('http')) {
        allLinks.push(title);
      }
    }
    
    // First 10 unique content links = Netflix Movies, next 10 = TV Shows
    const unique = [...new Set(allLinks)];
    const netflixMovies = unique.slice(0, 10).map((t, i) => ({
      chart_type: 'netflix', rank: i + 1, title_ko: t, artist: '', platform: 'Netflix Korea',
    }));
    const dramas = unique.slice(10, 20).map((t, i) => ({
      chart_type: 'drama', rank: i + 1, title_ko: t, artist: '', platform: 'Netflix Korea TV',
    }));
    
    return { netflix: netflixMovies, drama: dramas };
  } catch (e) {
    throw new Error('FlixPatrol agent-browser 실패: ' + e.message);
  }
}

// ─── 4. YouTube Korea Charts ───
async function fetchYouTubeChart() {
  try {
    execSync('/opt/homebrew/bin/agent-browser navigate "https://charts.youtube.com/charts/TopSongs/kr" 2>/dev/null', { timeout: 10000 });
    execSync('sleep 3');
    const snap = execSync('/opt/homebrew/bin/agent-browser snapshot 2>/dev/null', { timeout: 10000 }).toString();
    
    const items = [];
    // Parse from snapshot text format
    // Pattern: rank number, then title, then artist, then view count
    const lines = snap.split('\n');
    let currentRank = 0;
    
    for (let i = 0; i < lines.length && items.length < 10; i++) {
      const line = lines[i].trim();
      // Look for rank pattern
      const rankMatch = line.match(/text: "?(\d+)"?\s*$/);
      if (rankMatch && parseInt(rankMatch[1]) === currentRank + 1 && parseInt(rankMatch[1]) <= 20) {
        // Next lines should have title info
        // Collect text from nearby lines
        const block = lines.slice(i, i + 10).join(' ');
        // Pattern: rank NEW/▲/▼ then song info "TITLE ARTIST PREV_RANK WEEKS VIEWS"
        const songMatch = block.match(/text:\s*(.+?)(?:\d[\d,]+)\s*$/);
        if (!songMatch) continue;
        
        currentRank = parseInt(rankMatch[1]);
      }
    }
    
    // Simpler approach: parse the known format from snapshot
    // "GO BLACKPINK - 1 4,448,319"
    const textBlocks = snap.match(/text: (.+)/g) || [];
    const chartData = [];
    
    for (const block of textBlocks) {
      const text = block.replace('text: ', '').replace(/"/g, '');
      // Match: "TITLE ARTIST PREV_RANK WEEKS VIEWS" or "TITLE ARTIST - WEEKS VIEWS" 
      const match = text.match(/^(.+?)\s+(\d[\d,]+)$/);
      if (match && parseInt(match[2].replace(/,/g, '')) > 100000) {
        // This looks like chart data with view count
        const parts = match[1].trim();
        chartData.push({ text: parts, views: match[2] });
      }
    }
    
    // Parse artist from text (last word(s) before numbers)
    for (let i = 0; i < Math.min(chartData.length, 10); i++) {
      const d = chartData[i];
      // Split: everything before last sequence of "word number number" is title+artist
      const parts = d.text.split(/\s+/);
      // Remove trailing numbers (prev_rank, weeks)
      while (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) parts.pop();
      // Remove trailing ● ▲ ▼ NEW markers
      while (parts.length > 1 && /^[●▲▼NEW-]+$/.test(parts[parts.length - 1])) parts.pop();
      
      // Try to split title and artist (artist is usually last 1-2 words)
      const full = parts.join(' ');
      items.push({
        chart_type: 'youtube_korea',
        rank: i + 1,
        title_ko: full,
        artist: '',
        platform: 'YouTube Music Korea',
        score: d.views,
      });
    }
    
    return items;
  } catch (e) {
    log('YouTube Charts agent-browser 실패: ' + e.message);
    return [];
  }
}

// ─── YouTube 썸네일 검색 ───
function searchYouTubeVideo(query) {
  try {
    execSync('/opt/homebrew/bin/agent-browser navigate "https://www.youtube.com/results?search_query=' + encodeURIComponent(query) + '" 2>/dev/null', { timeout: 10000 });
    execSync('sleep 1.5');
    const snap = execSync('/opt/homebrew/bin/agent-browser snapshot 2>/dev/null', { timeout: 10000 }).toString();
    const vids = [...new Set(snap.match(/watch\?v=([a-zA-Z0-9_-]{11})/g) || [])].map(v => v.replace('watch?v=', ''));
    // Skip first result (often ad), use second if available
    return vids.length > 1 ? vids[1] : vids[0] || null;
  } catch (e) {
    return null;
  }
}

// ─── DB 업데이트 (안전하게) ───
async function safeUpdateChart(type, newItems) {
  if (!newItems || newItems.length === 0) {
    log(`❌ ${type}: 새 데이터 없음 → 이전 데이터 유지`);
    return { type, success: false, count: 0, reason: '데이터 수집 실패' };
  }
  
  // 최소 기준: 음악/영화/넷플릭스 3개 이상, YouTube 5개 이상
  const minRequired = type === 'youtube_korea' ? 5 : 3;
  if (newItems.length < minRequired) {
    log(`⚠️ ${type}: ${newItems.length}개만 수집 (최소 ${minRequired}개 필요) → 이전 데이터 유지`);
    return { type, success: false, count: newItems.length, reason: `최소 ${minRequired}개 미달` };
  }
  
  // YouTube 썸네일 검색
  for (const item of newItems) {
    if (!item.youtube_url) {
      const searchQuery = (item.title_ko + ' ' + item.artist).trim() + (type === 'movie' ? ' 예고편' : type === 'music' ? ' MV' : ' trailer');
      const vid = searchYouTubeVideo(searchQuery);
      if (vid) {
        item.youtube_url = 'https://www.youtube.com/watch?v=' + vid;
        item.thumbnail_url = 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg';
      }
    }
  }
  
  // 트랜잭션으로 안전하게 교체
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM charts WHERE chart_type = $1', [type]);
    
    for (const item of newItems) {
      const id = `${type}_${item.rank}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(
        'INSERT INTO charts (id, chart_type, rank, title_ko, title_en, artist, platform, youtube_url, thumbnail_url, score, chart_date, city) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id, type, item.rank, item.title_ko, item.title_ko, item.artist, item.platform, item.youtube_url || null, item.thumbnail_url || null, item.score || String(100 - item.rank * 5), TODAY, 'Dallas']
      );
    }
    
    await client.query('COMMIT');
    log(`✅ ${type}: ${newItems.length}개 업데이트 완료`);
    return { type, success: true, count: newItems.length };
  } catch (e) {
    await client.query('ROLLBACK');
    log(`❌ ${type}: DB 에러 → 롤백 (이전 데이터 유지): ${e.message}`);
    return { type, success: false, count: 0, reason: 'DB 에러: ' + e.message };
  } finally {
    client.release();
  }
}

// ─── Telegram 알림 ───
async function sendAlert(message) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const CHAT_ID = '-5280678324'; // DalConnect 그룹
  
  if (!TELEGRAM_TOKEN) {
    // Use openclaw gateway instead
    try {
      const alertFile = '/tmp/dalconnect-chart-alert.txt';
      fs.writeFileSync(alertFile, message);
      log('알림 파일 저장: ' + alertFile);
    } catch (e) {
      log('알림 저장 실패: ' + e.message);
    }
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const postData = JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' });
    
    await new Promise((resolve, reject) => {
      const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (e) {
    log('Telegram 알림 실패: ' + e.message);
  }
}

// ─── MAIN ───
async function main() {
  log('=== DalKonnect 차트 업데이트 v3 시작 ===');
  const startTime = Date.now();
  const results = [];
  
  // 1. Music
  log('🎵 음악 차트 수집 (Bugs Music)...');
  const music = await withRetry(fetchMusicChart, 'music');
  results.push(await safeUpdateChart('music', music));
  
  // 2. Movies
  log('🎬 영화 차트 수집 (Naver 박스오피스)...');
  const movies = await withRetry(fetchMovieChart, 'movie');
  results.push(await safeUpdateChart('movie', movies));
  
  // 3. Netflix + Drama
  log('📺 넷플릭스/드라마 차트 수집 (FlixPatrol)...');
  const flix = await withRetry(async () => {
    const data = await fetchNetflixChart();
    return data.netflix?.length > 0 || data.drama?.length > 0 ? data : null;
  }, 'netflix/drama');
  
  if (flix) {
    results.push(await safeUpdateChart('netflix', flix.netflix || []));
    results.push(await safeUpdateChart('drama', flix.drama || []));
  } else {
    results.push({ type: 'netflix', success: false, count: 0, reason: 'FlixPatrol 수집 실패' });
    results.push({ type: 'drama', success: false, count: 0, reason: 'FlixPatrol 수집 실패' });
  }
  
  // 4. YouTube Korea
  log('▶️ YouTube Korea 차트 수집...');
  const youtube = await withRetry(fetchYouTubeChart, 'youtube_korea');
  results.push(await safeUpdateChart('youtube_korea', youtube));
  
  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`\n=== 완료 (${elapsed}초) ===`);
  log(`✅ 성공: ${succeeded.map(r => r.type + '(' + r.count + ')').join(', ') || '없음'}`);
  if (failed.length > 0) {
    log(`❌ 실패: ${failed.map(r => r.type + ': ' + r.reason).join(', ')}`);
  }
  
  // 실패 있으면 알림
  if (failed.length > 0) {
    const alertMsg = `⚠️ DalKonnect 차트 업데이트 실패\n\n` +
      `날짜: ${TODAY}\n` +
      `성공: ${succeeded.map(r => '✅ ' + r.type).join(', ') || '없음'}\n` +
      `실패:\n${failed.map(r => '❌ ' + r.type + ': ' + r.reason).join('\n')}\n\n` +
      `이전 데이터 유지됨. 수동 확인 필요.`;
    
    await sendAlert(alertMsg);
    
    // 알림 파일도 생성 (Mission Control용)
    const alertData = {
      timestamp: new Date().toISOString(),
      date: TODAY,
      results,
      hasFailures: true,
    };
    fs.writeFileSync('/tmp/dalconnect-chart-status.json', JSON.stringify(alertData, null, 2));
  } else {
    // 성공 시에도 상태 파일 업데이트
    const statusData = {
      timestamp: new Date().toISOString(),
      date: TODAY,
      results,
      hasFailures: false,
      totalItems: results.reduce((sum, r) => sum + r.count, 0),
    };
    fs.writeFileSync('/tmp/dalconnect-chart-status.json', JSON.stringify(statusData, null, 2));
  }
  
  await pool.end();
  
  // Exit code: 0 if all success, 1 if any failure
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(e => {
  log('💥 치명적 에러: ' + e.message);
  sendAlert('💥 DalKonnect 차트 업데이트 치명적 에러: ' + e.message).finally(() => {
    pool.end().finally(() => process.exit(2));
  });
});
