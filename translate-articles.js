import pg from 'pg';

const DB_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({connectionString: DB_URL});

async function fetchEnglishArticles() {
  try {
    console.log('Fetching English articles...');
    const result = await pool.query("SELECT id, title, content, source FROM news WHERE title !~ '[가-힣]'");
    console.log(`Found ${result.rows.length} English articles to translate`);
    
    // Show first few articles as examples
    console.log('\nFirst few articles:');
    result.rows.slice(0, 3).forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Content: ${row.content?.substring(0, 100)}...`);
      console.log(`   Source: ${row.source}`);
      console.log('---');
    });
    
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

async function main() {
  try {
    const articles = await fetchEnglishArticles();
    console.log(`\nTotal articles to translate: ${articles.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();