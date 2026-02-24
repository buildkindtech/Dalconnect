import { Client } from 'pg';

// Database connection
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// Extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

// Generate YouTube thumbnail URL
function generateThumbnailUrl(videoId) {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Search for videos using SearXNG
async function searchVideo(title, chartType, artist = '') {
  try {
    let searchQuery = '';
    
    switch (chartType) {
      case 'drama':
        searchQuery = `${title} 드라마 공식 예고편`;
        break;
      case 'music':
        searchQuery = `${title} ${artist} MV`;
        break;
      case 'movie':
        searchQuery = `${title} 영화 예고편`;
        break;
      case 'netflix':
        searchQuery = `${title} 넷플릭스 예고편`;
        break;
      default:
        searchQuery = `${title} 예고편`;
    }
    
    console.log(`🔍 Searching for: "${searchQuery}"`);
    
    const response = await fetch(`http://localhost:8080/search?q=${encodeURIComponent(searchQuery)}&format=json`);
    
    if (!response.ok) {
      console.log(`❌ Search failed for "${searchQuery}": ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`❌ No results found for "${searchQuery}"`);
      return null;
    }
    
    // Look for YouTube results
    for (const result of data.results) {
      if (result.url && result.url.includes('youtube.com/watch')) {
        console.log(`✅ Found YouTube video: ${result.title}`);
        console.log(`   URL: ${result.url}`);
        return result.url;
      }
    }
    
    console.log(`❌ No YouTube results found for "${searchQuery}"`);
    return null;
    
  } catch (error) {
    console.error(`❌ Search error for "${title}":`, error.message);
    return null;
  }
}

// Update database with thumbnail URL
async function updateThumbnail(id, thumbnailUrl, youtubeUrl = null) {
  try {
    let query, values;
    
    if (youtubeUrl) {
      query = 'UPDATE charts SET thumbnail_url = $1, youtube_url = $2 WHERE id = $3';
      values = [thumbnailUrl, youtubeUrl, id];
    } else {
      query = 'UPDATE charts SET thumbnail_url = $1 WHERE id = $2';
      values = [thumbnailUrl, id];
    }
    
    await client.query(query, values);
    console.log(`✅ Updated thumbnail for ID: ${id}`);
    
  } catch (error) {
    console.error(`❌ Database update error for ID ${id}:`, error.message);
  }
}

// Main processing function
async function processThumbnails() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get all charts
    const result = await client.query('SELECT id, title_ko, chart_type, youtube_url, thumbnail_url, artist FROM charts ORDER BY chart_type, rank');
    
    console.log(`📊 Processing ${result.rows.length} charts...`);
    console.log('='.repeat(80));
    
    let processed = 0;
    let withExistingYoutube = 0;
    let foundNewVideos = 0;
    let notFound = 0;
    
    for (const row of result.rows) {
      processed++;
      console.log(`\n[${processed}/${result.rows.length}] Processing: ${row.title_ko} (${row.chart_type})`);
      
      if (row.youtube_url) {
        // Extract video ID and generate thumbnail
        const videoId = extractVideoId(row.youtube_url);
        if (videoId) {
          const thumbnailUrl = generateThumbnailUrl(videoId);
          await updateThumbnail(row.id, thumbnailUrl);
          withExistingYoutube++;
          console.log(`   ✅ Updated thumbnail from existing YouTube URL`);
        } else {
          console.log(`   ❌ Could not extract video ID from: ${row.youtube_url}`);
        }
      } else {
        // Search for video
        const youtubeUrl = await searchVideo(row.title_ko, row.chart_type, row.artist);
        
        if (youtubeUrl) {
          const videoId = extractVideoId(youtubeUrl);
          if (videoId) {
            const thumbnailUrl = generateThumbnailUrl(videoId);
            await updateThumbnail(row.id, thumbnailUrl, youtubeUrl);
            foundNewVideos++;
            console.log(`   ✅ Found and updated new YouTube video`);
          } else {
            console.log(`   ❌ Could not extract video ID from found URL: ${youtubeUrl}`);
            notFound++;
          }
        } else {
          notFound++;
        }
        
        // Add delay to avoid overwhelming SearXNG
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 PROCESSING COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Updated existing YouTube videos: ${withExistingYoutube}`);
    console.log(`✅ Found new YouTube videos: ${foundNewVideos}`);
    console.log(`❌ Not found/failed: ${notFound}`);
    console.log(`📊 Total processed: ${processed}`);
    
  } catch (error) {
    console.error('❌ Main process error:', error);
  } finally {
    await client.end();
    console.log('🔚 Database connection closed');
  }
}

// Run the script
processThumbnails();