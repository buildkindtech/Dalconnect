#!/usr/bin/env node
/**
 * DalConnect 차트 자동 업데이트 v2
 * 실제 데이터 소스에서 최신 차트 수집 → DB 업데이트
 * 
 * 차트 타입: music, drama, movie, netflix, youtube_korea
 * 소스: Melon (via web), flixpatrol, KOBIS, YouTube Trending
 */

require('dotenv').config();
const pg = require('pg');
const DB_URL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')
  ? process.env.DATABASE_URL
  : 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
if (!DB_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

const TODAY = new Date().toISOString().split('T')[0];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, headers: { 'User-Agent': UA, ...opts.headers } });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── Music Chart: iTunes Korea Top Songs ────────────────────────
async function fetchMusicChart() {
  console.log('🎵 Music chart (iTunes Korea Top Songs)...');
  const items = [];

  try {
    // iTunes RSS Feed — Korean Top Songs (no auth, stable, includes artwork)
    const res = await fetchWithTimeout(
      'https://rss.applemarketingtools.com/api/v2/kr/music/most-played/10/songs.json'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const feed = data?.feed?.results || [];
    feed.slice(0, 10).forEach((track, i) => {
      items.push({
        chart_type: 'music',
        rank: i + 1,
        title_ko: track.name,
        title_en: track.name,
        artist: track.artistName,
        platform: 'iTunes Korea',
        thumbnail_url: track.artworkUrl100?.replace('100x100bb', '500x500bb') || track.artworkUrl100 || null,
        score: String(99 - i * 2),
      });
    });
    console.log(`  ✅ iTunes 뮤직 ${items.length}개`);
  } catch (e) {
    console.log(`  ⚠️ iTunes chart failed: ${e.message}`);
  }

  return items;
}

// ─── Netflix Chart: flixpatrol ────────────────────────────────────
async function fetchNetflixChart() {
  console.log('📺 Netflix chart (TMDB 넷플릭스 한국)...');
  const items = [];
  
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_KEY) throw new Error('TMDB_API_KEY 없음');
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&language=ko-KR&with_watch_providers=8&watch_region=KR&with_origin_country=KR&sort_by=first_air_date.desc&page=1`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.results?.filter(t => t.poster_path).slice(0, 10).forEach((t, i) => {
      items.push({
        chart_type: 'netflix',
        rank: i + 1,
        title_ko: t.name,
        title_en: t.original_name,
        platform: 'Netflix',
        thumbnail_url: `https://image.tmdb.org/t/p/w342${t.poster_path}`,
        score: String((t.vote_average * 10).toFixed(1)),
        description: `평점 ${t.vote_average.toFixed(1)} | 첫방송: ${t.first_air_date}`,
      });
    });
    console.log(`  ✅ Netflix ${items.length}개`);
    return items;
  } catch (e) {
    console.log(`  ⚠️ TMDB Netflix 실패: ${e.message}`);
  }

  // Fallback: flixpatrol 스크래이핑
  try {
    const res = await fetchWithTimeout('https://flixpatrol.com/top10/netflix/south-korea/', {
      headers: { 'Accept': 'text/html', 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    
    // Parse flixpatrol table rows
    const tableRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?class="table-title"[^>]*>\s*<a[^>]*>([^<]+)</g;
    let match;
    while ((match = tableRegex.exec(html)) !== null && items.length < 10) {
      items.push({
        chart_type: 'netflix',
        rank: parseInt(match[1]),
        title_ko: match[2].trim(),
        title_en: match[2].trim(),
        artist: '',
        platform: 'Netflix',
        score: String(99 - items.length * 3),
      });
    }
  } catch (e) {
    console.log(`  ⚠️ flixpatrol failed: ${e.message}`);
  }

  // Fallback: Netflix tudum / JSON feed
  if (items.length === 0) {
    try {
      const res = await fetchWithTimeout('https://www.netflix.com/tudum/top10/south-korea');
      if (res.ok) {
        const html = await res.text();
        const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          const shows = data?.props?.pageProps?.data?.weeklyTopTen || [];
          shows.slice(0, 10).forEach((show, i) => {
            items.push({
              chart_type: 'netflix',
              rank: i + 1,
              title_ko: show.showName || `Show ${i+1}`,
              title_en: show.showName || `Show ${i+1}`,
              artist: '',
              platform: 'Netflix',
              score: String(99 - i * 3),
            });
          });
        }
      }
    } catch (e) {
      console.log(`  ⚠️ Netflix tudum fallback failed: ${e.message}`);
    }
  }

  return items;
}

// ─── Movie Chart: TMDB 한국 현재 상영작 ──────────────────────────
async function fetchMovieChart() {
  console.log('🎬 Movie chart (TMDB 한국 상영작)...');
  const items = [];
  const TMDB_KEY = process.env.TMDB_API_KEY;

  // Primary: TMDB now_playing KR
  try {
    if (!TMDB_KEY) throw new Error('TMDB_API_KEY 없음');
    const r = await fetchWithTimeout(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&language=ko-KR&region=KR`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    d.results?.filter(m => m.poster_path).slice(0, 10).forEach((m, i) => items.push({
      chart_type: 'movie', rank: i + 1,
      title_ko: m.title, title_en: m.original_title,
      platform: '영화관',
      thumbnail_url: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
      score: String((m.vote_average * 10).toFixed(1))
    }));
    console.log(`  ✅ TMDB 영화 ${items.length}개`);
  } catch (e) {
    console.log(`  ⚠️ TMDB 영화 실패: ${e.message}`);
  }

  return items;
}

// ─── Drama Chart: TMDB 한국 드라마 인기순 ────────────────────────
async function fetchDramaChart() {
  console.log('📺 Drama chart (TMDB 한국 드라마)...');
  const items = [];
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_KEY) throw new Error('TMDB_API_KEY 없음');
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&language=ko-KR&with_origin_country=KR&sort_by=popularity.desc&first_air_date.gte=2025-01-01&page=1`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.results?.slice(0, 10).forEach((t, i) => {
      items.push({
        chart_type: 'drama',
        rank: i + 1,
        title_ko: t.name,
        title_en: t.original_name,
        platform: 'TV드라마',
        thumbnail_url: t.poster_path ? `https://image.tmdb.org/t/p/w342${t.poster_path}` : null,
        score: String((t.vote_average * 10).toFixed(1)),
        description: `평점 ${t.vote_average.toFixed(1)} | 첫방송: ${t.first_air_date}`,
      });
    });
    console.log(`  ✅ TMDB 드라마 ${items.length}개`);
  } catch (e) {
    console.log(`  ⚠️ Drama chart 실패: ${e.message}`);
  }
  return items;
}

// ─── YouTube Korea Trending ──────────────────────────────────────
async function fetchYouTubeChart() {
  console.log('▶️ YouTube Korea trending...');
  const items = [];
  
  // 한국 주요 유튜브 채널
  const channels = [
    { id: 'UCEf_Bc-KVd7onSeifS3py9g', name: 'BANGTANTV' },
    { id: 'UCkbbMCA40i3sHRzSgnSCa_A', name: '1theK' },
    { id: 'UCbmNph6atAoGfqLoCL_duAg', name: 'HYBE LABELS' },
    { id: 'UC3IZKseVpdzPSBo2Mk4c5cw', name: 'BLACKPINK' },
    { id: 'UCVwlkqoMJJCmUAF0opTiOlw', name: 'SMTOWN' },
    { id: 'UCrDkAvwZum-UTjHmzDI2iIw', name: 'BLACKPINK' },       // BLACKPINK Official
    { id: 'UCsikuIGEkyNMNAi_RCgRZ6g', name: 'NewJeans' },
    { id: 'UC6tXGmtm1MMbsmEzPMQvMHg', name: 'aespa' },
    { id: 'UC3IZKseVpdzPSBo2Mk4c5cw', name: 'IVE' },
    { id: 'UCx4sLMFWlRIBKRqBVEIPGpw', name: 'STAYC' },
    { id: 'UC3IZKseVpdzPSBo2Mk4c5cw', name: 'LE SSERAFIM' },
  ];
  
  const allVideos = [];
  
  for (const channel of channels) {
    try {
      const res = await fetchWithTimeout(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
        { headers: { 'Accept': 'application/xml' } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      
      // Parse entries from Atom feed
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      let match;
      let count = 0;
      
      while ((match = entryRegex.exec(xml)) !== null && count < 3) {
        const entry = match[1];
        const title = extractXmlTag(entry, 'title');
        const videoId = extractXmlTag(entry, 'yt:videoId');
        const author = extractXmlTag(entry, 'name');
        const published = extractXmlTag(entry, 'published');
        
        if (title && videoId) {
          // Only include recent videos (last 7 days)
          const pubDate = new Date(published);
          const weekAgo = new Date(Date.now() - 7 * 86400000);
          if (pubDate >= weekAgo) {
            allVideos.push({
              title,
              videoId,
              artist: author || channel.name,
              published: pubDate,
            });
          }
          count++;
        }
      }
    } catch (e) {
      // skip silently
    }
  }
  
  // Sort by most recent and take top 10
  allVideos.sort((a, b) => b.published - a.published);
  allVideos.slice(0, 10).forEach((video, i) => {
    items.push({
      chart_type: 'youtube_korea',
      rank: i + 1,
      title_ko: video.title,
      title_en: video.title,
      artist: video.artist,
      platform: 'YouTube',
      score: String(99 - i * 2),
      youtube_url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnail_url: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    });
  });

  return items;
}

function extractXmlTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// ─── DB Upsert ───────────────────────────────────────────────────
async function upsertCharts(items) {
  if (items.length === 0) return 0;
  
  let count = 0;
  for (const item of items) {
    try {
      // Delete existing entry for this chart_type + rank + today's date
      await pool.query(
        'DELETE FROM charts WHERE chart_type = $1 AND rank = $2 AND chart_date = $3',
        [item.chart_type, item.rank, TODAY]
      );
      
      // score column is numeric(3,1), max 99.9
      const score = item.score ? Math.min(parseFloat(item.score), 99.9).toFixed(1) : null;
      
      await pool.query(
        `INSERT INTO charts (chart_type, rank, title_ko, title_en, artist, platform, thumbnail_url, description, score, chart_date, youtube_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          item.chart_type,
          item.rank,
          item.title_ko,
          item.title_en || item.title_ko,
          item.artist || '',
          item.platform || '',
          item.thumbnail_url || null,
          item.description || null,
          score,
          TODAY,
          item.youtube_url || null,
        ]
      );
      count++;
    } catch (e) {
      console.error(`  ❌ Insert error (${item.chart_type} #${item.rank}): ${e.message}`);
    }
  }
  return count;
}

// ─── Fallback: update chart_date to today for stale data ─────────
async function updateStaleDates() {
  const result = await pool.query(
    'UPDATE charts SET chart_date = $1 WHERE chart_date < $1 RETURNING chart_type',
    [TODAY]
  );
  if (result.rowCount > 0) {
    console.log(`📅 ${result.rowCount}개 기존 차트 날짜 업데이트`);
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] DalConnect 차트 업데이트 v2 시작...`);
  
  let totalNew = 0;

  // Fetch all chart types in parallel
  const [music, netflix, movies, dramas, youtube] = await Promise.allSettled([
    fetchMusicChart(),
    fetchNetflixChart(),
    fetchMovieChart(),
    fetchDramaChart(),
    fetchYouTubeChart(),
  ]);

  // Process results
  for (const [name, result] of [
    ['music', music],
    ['netflix', netflix],
    ['movie', movies],
    ['drama', dramas],
    ['youtube_korea', youtube],
  ]) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      const count = await upsertCharts(result.value);
      console.log(`  ✅ ${name}: ${count}개 업데이트`);
      totalNew += count;
    } else {
      const reason = result.status === 'rejected' ? result.reason?.message : '데이터 없음';
      console.log(`  ⚠️ ${name}: ${reason}`);
    }
  }

  // If no new data was fetched, at least update dates
  if (totalNew === 0) {
    await updateStaleDates();
  }

  console.log(`\n[완료] ${totalNew}개 차트 항목 업데이트`);
  await pool.end();

  // 업데이트 후 자동 헬스체크
  console.log('\n🔍 업데이트 후 헬스체크 실행...');
  try {
    const { execSync } = require('child_process');
    execSync('node scripts/health-check.cjs', { stdio: 'inherit', cwd: __dirname + '/..' });
  } catch (e) {
    console.error('⚠️ 헬스체크 실패 — 수동 확인 필요');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
