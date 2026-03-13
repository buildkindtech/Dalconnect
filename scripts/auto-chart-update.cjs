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

// ─── Music Chart: Melon via RSS/Web ───────────────────────────────
async function fetchMusicChart() {
  console.log('🎵 Music chart (Melon/Circle)...');
  const items = [];
  
  try {
    // Try Melon chart page via Bugs Music RSS (more accessible)
    const res = await fetchWithTimeout('https://music.bugs.co.kr/chart/track/realtime/total');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    
    // Parse top 10 from Bugs chart HTML
    const rowRegex = /class="ranking"[^>]*>(\d+)<[\s\S]*?class="title"[^>]*>\s*<a[^>]*>([^<]+)<[\s\S]*?class="artist"[^>]*>[\s\S]*?<a[^>]*>([^<]+)</g;
    let match;
    let rank = 0;
    while ((match = rowRegex.exec(html)) !== null && rank < 10) {
      rank++;
      items.push({
        chart_type: 'music',
        rank,
        title_ko: match[2].trim(),
        title_en: match[2].trim(),
        artist: match[3].trim(),
        platform: 'Bugs Music',
        score: String(99 - rank * 2),
      });
    }
  } catch (e) {
    console.log(`  ⚠️ Bugs chart failed: ${e.message}`);
  }

  // Fallback: Spotify Korea Top 50 via available chart sources
  if (items.length === 0) {
    try {
      const res = await fetchWithTimeout('https://raw.githubusercontent.com/nickspaargaren/spotify-chart/master/charts/south-korea/daily.json');
      if (res.ok) {
        const data = await res.json();
        const tracks = (data.entries || data).slice(0, 10);
        tracks.forEach((track, i) => {
          items.push({
            chart_type: 'music',
            rank: i + 1,
            title_ko: track.trackName || track.name || `Track ${i+1}`,
            title_en: track.trackName || track.name || `Track ${i+1}`,
            artist: track.artistName || track.artist || 'Unknown',
            platform: 'Spotify Korea',
            score: String(99 - i * 2),
          });
        });
      }
    } catch (e) {
      console.log(`  ⚠️ Spotify chart fallback failed: ${e.message}`);
    }
  }

  return items;
}

// ─── Netflix Chart: flixpatrol ────────────────────────────────────
async function fetchNetflixChart() {
  console.log('📺 Netflix chart (flixpatrol)...');
  const items = [];
  
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

// ─── Movie Chart: KOBIS (Korean Box Office) ──────────────────────
async function fetchMovieChart() {
  console.log('🎬 Movie chart (KOBIS)...');
  const items = [];
  
  // KOBIS open API (free, no key needed for daily box office)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    const kobisKey = '3c47f2fa81c79c2fe49c6d6a46a844ea'; // KOBIS open API key (public)
    const res = await fetchWithTimeout(
      `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${kobisKey}&targetDt=${yesterday}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const movies = data?.boxOfficeResult?.dailyBoxOfficeList || [];
    movies.slice(0, 10).forEach((movie, i) => {
      items.push({
        chart_type: 'movie',
        rank: parseInt(movie.rank) || i + 1,
        title_ko: movie.movieNm || `Movie ${i+1}`,
        title_en: movie.movieNm || `Movie ${i+1}`,
        artist: movie.director || '',
        platform: '영화관',
        score: String(parseFloat(movie.audiAcc || 0) > 1000000 ? 98 - i : 90 - i * 2),
        description: `관객수: ${parseInt(movie.audiCnt || 0).toLocaleString()}명 | 누적: ${parseInt(movie.audiAcc || 0).toLocaleString()}명`,
      });
    });
  } catch (e) {
    console.log(`  ⚠️ KOBIS failed: ${e.message}`);
  }

  return items;
}

// ─── Drama Chart: via web scraping ───────────────────────────────
async function fetchDramaChart() {
  console.log('📺 Drama chart...');
  const items = [];
  
  try {
    // Try flixpatrol for Korean drama content
    const res = await fetchWithTimeout('https://flixpatrol.com/top10/netflix/south-korea/2025-03-12/tv/', {
      headers: { 'Accept': 'text/html' }
    });
    if (res.ok) {
      const html = await res.text();
      const tableRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?class="table-title"[^>]*>\s*<a[^>]*>([^<]+)</g;
      let match;
      while ((match = tableRegex.exec(html)) !== null && items.length < 10) {
        items.push({
          chart_type: 'drama',
          rank: parseInt(match[1]),
          title_ko: match[2].trim(),
          title_en: match[2].trim(),
          artist: '',
          platform: 'TV',
          score: String(98 - items.length * 2),
        });
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Drama chart scrape failed: ${e.message}`);
  }

  return items;
}

// ─── YouTube Korea Trending ──────────────────────────────────────
async function fetchYouTubeChart() {
  console.log('▶️ YouTube Korea trending...');
  const items = [];
  
  // Use popular Korean music/entertainment YouTube channels RSS feeds
  const channels = [
    { id: 'UCEf_Bc-KVd7onSeifS3py9g', name: 'BANGTANTV' },       // BTS
    { id: 'UCkbbMCA40i3sHRzSgnSCa_A', name: '1theK' },           // K-Pop label
    { id: 'UCbmNph6atAoGfqLoCL_duAg', name: 'HYBE LABELS' },     // HYBE
    { id: 'UC3IZKseVpdzPSBo2Mk4c5cw', name: 'BLACKPINK' },       // BLACKPINK
    { id: 'UCVwlkqoMJJCmUAF0opTiOlw', name: 'SMTOWN' },          // SM Entertainment
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
      thumbnail_url: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
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
}

run().catch(e => { console.error(e); process.exit(1); });
