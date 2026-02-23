import pg from 'pg';

const DB_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({connectionString: DB_URL});

async function getFullArticleList() {
  try {
    const result = await pool.query("SELECT id, title, content, source FROM news WHERE title !~ '[가-힣]' ORDER BY id");
    
    console.log(`Total English articles: ${result.rows.length}\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Content: ${row.content?.substring(0, 150)}...`);
      console.log(`   Source: ${row.source}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getFullArticleList();