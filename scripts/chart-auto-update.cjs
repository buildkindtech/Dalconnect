#!/usr/bin/env node
/**
 * DalKonnect 차트 자동 업데이트 v4
 * 
 * 소스: Bugs Music, Naver 박스오피스, FlixPatrol (Netflix+Drama), YouTube Charts
 * 에러 시: 이전 데이터 유지 (ROLLBACK) + 3회 재시도 + 텔레그램 알림
 * 크론: 매일 6am CST
 */

const { execSync } = require('child_process');
const pg = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const AB = '/opt/homebrew/bin/agent-browser';
const TODAY = new Date().toISOString().split('T')[0];
const LOG_FILE = '/tmp/dalconnect-charts.log';
const STATUS_FILE = '/tmp/dalconnect-chart-status.json';
const MAX_RETRIES = 3;

const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function ab(cmd) {
  try {
    return execSync(`${AB} ${cmd}`, { encoding: 'utf8', timeout: 30000 });
  } catch (e) {
    return e.stdout || '';
  }
}

function abSnapshot() {
  try {
    return execSync(`${AB} snapshot`, { encoding: 'utf8', timeout: 15000 });
  } catch (e) {
    return e.stdout || '';
  }
}

// ===== YouTube 영상 검색 =====
function findYouTubeId(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    ab(`open "${searchUrl}"`);
    execSync('sleep 3');
    const snap = abSnapshot();
    // Look for watch?v= links
    const matches = snap.match(/watch\?v=([a-zA-Z0-9_-]{11})/g);
    if (matches && matches.length > 0) {
      const id = matches[0].replace('watch?v=', '');
      return id;
    }
  } catch (e) {}
  return null;
}

// ===== 1. BUGS MUSIC =====
async function fetchMusic() {
  log('🎵 Bugs Music 스크래핑 시작...');
  ab('open "https://music.bugs.co.kr/chart/track/realtime/total"');
  execSync('sleep 4');
  
  const snap = abSnapshot();
  const items = [];
  
  // Parse: find song titles and artists from Bugs chart
  // Pattern: ranked list with song name and artist
  const lines = snap.split('\n');
  let currentTitle = null;
  
  for (const line of lines) {
    if (items.length >= 10) break;
    
    const trimmed = line.trim();
    // Bugs shows: title on one line, artist details nearby
    // Look for pattern in the snapshot text
    if (trimmed.startsWith('- text:')) {
      const text = trimmed.replace('- text:', '').trim().replace(/^["']|["']$/g, '');
      if (text && text !== ',' && text.length > 1 && 
          !['듣기', '재생목록에 추가', '다운로드', '영상 재생', '내 앨범에 담기',
            '벅스', '웹 플레이어', '플레이어 선택', '검색어 삭제', '내 음악', '테마', '투표',
            '선택된 곡 재생 듣기', '전체 듣기(재생목록 추가)', '전체 듣기(재생목록 교체)',
            '커넥트 아티스트가 직접 올린 곡과 영상입니다.'].includes(text) &&
          !text.startsWith('2026.') && !text.match(/^\d+$/)) {
        if (!currentTitle) {
          currentTitle = text;
        } else {
          items.push({ title: currentTitle, artist: text, rank: items.length + 1 });
          currentTitle = null;
        }
      }
    }
  }
  
  if (items.length < 5) {
    // Fallback: use exec to get structured data
    try {
      const result = execSync(`${AB} exec "document.querySelectorAll('.chartContent .title').forEach((e,i) => console.log(i+1, e.textContent.trim()))"`, { encoding: 'utf8', timeout: 10000 });
      log('Fallback exec attempted');
    } catch(e) {}
  }
  
  if (items.length < 3) throw new Error(`Music: ${items.length}개만 확보 (최소 3개 필요)`);
  
  log(`🎵 Music ${items.length}개 확보`);
  return items.slice(0, 10);
}

// ===== 2. NAVER 박스오피스 =====
async function fetchMovies() {
  log('🎬 Naver 박스오피스 스크래핑 시작...');
  ab('open "https://m.search.naver.com/search.naver?query=%EB%B0%95%EC%8A%A4%EC%98%A4%ED%94%BC%EC%8A%A4+%EC%88%9C%EC%9C%84"');
  execSync('sleep 4');
  
  const snap = abSnapshot();
  const items = [];
  
  // Pattern: "1 영화제목 영화제목 관객수명" in link text
  const linkPattern = /link "(\d+)\s+(.+?)\s+\1.*?(\d[\d,]*명)"/g;
  // Simpler: find links with rank + title + audience
  const lines = snap.split('\n');
  
  for (const line of lines) {
    if (items.length >= 10) break;
    // Match pattern like: link "1 왕과 사는 남자 왕과 사는 남자 15만명"
    const m = line.match(/link "(\d+)\s+(.+?)\s+\2\s+([\d,]+만?명)"/);
    if (m) {
      items.push({
        title: m[2].trim(),
        artist: m[3], // audience count
        rank: parseInt(m[1])
      });
    }
  }
  
  // Fallback: simpler pattern
  if (items.length < 3) {
    const m2 = snap.match(/link "(\d+)\s+([^\d"]+?)\s+\2\s+/g);
    if (m2) {
      for (const match of m2) {
        if (items.length >= 10) break;
        const parts = match.match(/link "(\d+)\s+(.+?)\s+\2/);
        if (parts) {
          items.push({
            title: parts[2].trim(),
            artist: '',
            rank: parseInt(parts[1])
          });
        }
      }
    }
  }
  
  if (items.length < 3) throw new Error(`Movie: ${items.length}개만 확보 (최소 3개 필요)`);
  
  log(`🎬 Movie ${items.length}개 확보`);
  return items.slice(0, 10);
}

// ===== 3. FLIXPATROL (Netflix + Drama) =====
async function fetchFlixPatrol() {
  log('📺 FlixPatrol 스크래핑 시작...');
  ab('open "https://flixpatrol.com/top10/netflix/south-korea/"');
  execSync('sleep 5');
  
  const snap = abSnapshot();
  const netflix = [];
  const drama = [];
  
  const lines = snap.split('\n');
  let section = null; // 'movies' or 'tv'
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.includes('TOP 10 Movies')) section = 'movies';
    if (trimmed.includes('TOP 10 TV Shows')) section = 'tv';
    if (trimmed.includes('TOP 10 Kids')) section = null; // stop
    
    // FlixPatrol links: link "Title" [ref=eXX]
    const linkMatch = trimmed.match(/link "([^"]+)" \[ref=e(\d+)\]/);
    if (linkMatch && section) {
      const title = linkMatch[1];
      // Skip navigation/header links
      if (['TOP 10', 'Popularity', 'Calendar', 'Preferences', 'Most watched', 
           'Persons', 'Services', 'Budget', 'Sign in', 'Netflix', 'South Korea',
           'Yesterday', 'homepage'].includes(title)) continue;
      if (title.length < 2) continue;
      
      if (section === 'movies' && netflix.length < 10) {
        netflix.push({ title, artist: 'Netflix', rank: netflix.length + 1 });
      } else if (section === 'tv' && drama.length < 10) {
        drama.push({ title, artist: 'Netflix', rank: drama.length + 1 });
      }
    }
  }
  
  // Deduplicate (FlixPatrol shows titles twice sometimes)
  const dedup = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    }).map((item, i) => ({ ...item, rank: i + 1 }));
  };
  
  const netflixClean = dedup(netflix).slice(0, 10);
  const dramaClean = dedup(drama).slice(0, 10);
  
  if (netflixClean.length < 3) throw new Error(`Netflix: ${netflixClean.length}개만 확보`);
  if (dramaClean.length < 3) throw new Error(`Drama: ${dramaClean.length}개만 확보`);
  
  log(`📺 Netflix ${netflixClean.length}개, Drama ${dramaClean.length}개 확보`);
  return { netflix: netflixClean, drama: dramaClean };
}

// ===== 4. YOUTUBE CHARTS =====
async function fetchYouTube() {
  log('▶️ YouTube Charts 스크래핑 시작...');
  ab('open "https://charts.youtube.com/charts/TopSongs/kr"');
  execSync('sleep 5');
  
  const snap = abSnapshot();
  const items = [];
  const lines = snap.split('\n');
  
  // YouTube Charts shows song entries
  for (const line of lines) {
    if (items.length >= 10) break;
    // Look for song titles in the chart
    const linkMatch = line.match(/link "([^"]+)" \[ref=e(\d+)\]/);
    if (linkMatch) {
      const title = linkMatch[1];
      if (title.length > 1 && title.length < 100 &&
          !['TopSongs', 'Top Songs', 'Charts', 'YouTube', 'Music', 'Artists',
            'Trending', 'Global', 'South Korea', 'Weekly', 'Sign in'].includes(title)) {
        items.push({ title, artist: '', rank: items.length + 1 });
      }
    }
  }
  
  if (items.length < 5) throw new Error(`YouTube: ${items.length}개만 확보 (최소 5개 필요)`);
  
  log(`▶️ YouTube ${items.length}개 확보`);
  return items.slice(0, 10);
}

// ===== DB 업데이트 (트랜잭션) =====
async function updateChart(chartType, items, skipYouTube = false) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 기존 데이터 백업 (실패 시 ROLLBACK으로 복원)
    await client.query(`DELETE FROM charts WHERE chart_type = $1`, [chartType]);
    
    for (const item of items) {
      let videoId = null;
      let thumbnail = null;
      
      if (!skipYouTube) {
        const searchQuery = `${item.title} ${item.artist || ''} official MV`.trim();
        try {
          videoId = findYouTubeId(searchQuery);
          if (videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        } catch (e) {
          log(`⚠️ YouTube 검색 실패: ${item.title}`);
        }
      }
      
      const id = `${chartType}-${item.rank}-${Date.now()}`;
      await client.query(
        `INSERT INTO charts (id, chart_type, rank, title_ko, title_en, artist, platform, thumbnail_url, youtube_url, score, chart_date, created_at, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 'dallas')`,
        [
          id,
          chartType,
          item.rank,
          item.title,
          item.titleEn || item.title,
          item.artist || '',
          item.platform || chartType,
          thumbnail || '',
          videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
          item.score || '',
          TODAY
        ]
      );
    }
    
    await client.query('COMMIT');
    log(`✅ ${chartType} ${items.length}개 DB 업데이트 완료`);
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    log(`❌ ${chartType} DB ROLLBACK — 이전 데이터 유지: ${e.message}`);
    return false;
  } finally {
    client.release();
  }
}

// ===== 재시도 래퍼 =====
async function withRetry(name, fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      log(`⚠️ ${name} 시도 ${attempt}/${MAX_RETRIES} 실패: ${e.message}`);
      if (attempt < MAX_RETRIES) {
        execSync('sleep 5');
      } else {
        throw e;
      }
    }
  }
}

// ===== 메인 =====
async function main() {
  log('='.repeat(60));
  log(`🚀 차트 자동 업데이트 시작 (${TODAY})`);
  
  const results = { music: false, movie: false, netflix: false, drama: false, youtube_korea: false };
  const errors = [];
  
  // 1. Music (Bugs) — YouTube 검색 스킵 (시간 절약)
  try {
    const music = await withRetry('Music', fetchMusic);
    results.music = await updateChart('music', music, true);
  } catch (e) {
    errors.push(`🎵 Music 실패: ${e.message}`);
    log(`❌ Music 최종 실패: ${e.message}`);
  }
  
  // 2. Movie (Naver)
  try {
    const movies = await withRetry('Movie', fetchMovies);
    results.movie = await updateChart('movie', movies, true);
  } catch (e) {
    errors.push(`🎬 Movie 실패: ${e.message}`);
    log(`❌ Movie 최종 실패: ${e.message}`);
  }
  
  // 3. Netflix + Drama (FlixPatrol)
  try {
    const flix = await withRetry('FlixPatrol', fetchFlixPatrol);
    results.netflix = await updateChart('netflix', flix.netflix, true);
    results.drama = await updateChart('drama', flix.drama, true);
  } catch (e) {
    errors.push(`📺 Netflix/Drama 실패: ${e.message}`);
    log(`❌ FlixPatrol 최종 실패: ${e.message}`);
  }
  
  // 4. YouTube (weekly — skip if not Monday)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 1) { // Monday only
    try {
      const yt = await withRetry('YouTube', fetchYouTube);
      results.youtube_korea = await updateChart('youtube_korea', yt, true);
    } catch (e) {
      errors.push(`▶️ YouTube 실패: ${e.message}`);
      log(`❌ YouTube 최종 실패: ${e.message}`);
    }
  } else {
    results.youtube_korea = true; // skip, keep existing
    log('▶️ YouTube: 월요일만 업데이트 (스킵)');
  }
  
  // 5. YouTube 영상 매칭 (전체 차트에 대해 한 번에)
  log('🔗 YouTube 영상 매칭 시작...');
  try {
    const { rows } = await pool.query(`SELECT id, title_ko, artist, chart_type FROM charts WHERE youtube_url = '' OR youtube_url IS NULL`);
    let matched = 0;
    for (const row of rows.slice(0, 30)) { // 최대 30개 (시간 제한)
      // 차트 타입별 검색어 최적화
      let q;
      if (row.chart_type === 'movie') {
        q = `${row.title_ko} 영화 예고편`.trim();
      } else if (row.chart_type === 'netflix' || row.chart_type === 'drama') {
        q = `${row.title_ko} ${row.artist || ''} 예고편`.trim();
      } else {
        q = `${row.title_ko} ${row.artist || ''} official`.trim();
      }
      const vid = findYouTubeId(q);
      if (vid) {
        await pool.query(`UPDATE charts SET youtube_url = $1, thumbnail_url = $2 WHERE id = $3`, [
          `https://www.youtube.com/watch?v=${vid}`,
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          row.id
        ]);
        matched++;
      }
      execSync('sleep 1');
    }
    log(`🔗 YouTube 매칭: ${matched}/${rows.length}개 완료`);
  } catch (e) {
    log(`⚠️ YouTube 매칭 실패 (차트 데이터는 유지): ${e.message}`);
  }
  
  // Close browser
  try { ab('close'); } catch(e) {}
  
  // Status 저장
  const status = {
    lastRun: new Date().toISOString(),
    date: TODAY,
    results,
    errors,
    success: errors.length === 0
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  
  // 결과 로그
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  log(`\n📊 결과: ${successCount}/${totalCount} 성공`);
  
  if (errors.length > 0) {
    const alertMsg = `⚠️ DalKonnect 차트 업데이트 일부 실패 (${TODAY})\n\n${errors.join('\n')}\n\n이전 데이터는 유지됨.`;
    log(alertMsg);
    fs.writeFileSync('/tmp/dalconnect-chart-alert.txt', alertMsg);
    // Alert will be sent by cron wrapper
    console.error('ALERT:' + alertMsg);
  } else {
    log('✅ 전체 차트 업데이트 성공!');
  }
  
  await pool.end();
  log('='.repeat(60));
}

main().catch(e => {
  log(`💥 치명적 오류: ${e.message}`);
  fs.writeFileSync('/tmp/dalconnect-chart-alert.txt', `💥 차트 업데이트 치명적 오류: ${e.message}`);
  console.error('ALERT:💥 ' + e.message);
  process.exit(1);
});
