import pg from 'pg';

const DB_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({connectionString: DB_URL});

async function checkAllArticles() {
  try {
    // Total count
    const totalResult = await pool.query("SELECT count(*) as total FROM news");
    console.log(`Total articles in database: ${totalResult.rows[0].total}`);

    // Korean articles (contains Korean characters)
    const koreanResult = await pool.query("SELECT count(*) as korean FROM news WHERE title ~ '[가-힣]'");
    console.log(`Korean articles: ${koreanResult.rows[0].korean}`);

    // English articles (no Korean characters)
    const englishResult = await pool.query("SELECT count(*) as english FROM news WHERE title !~ '[가-힣]'");
    console.log(`English articles: ${englishResult.rows[0].english}`);

    // Show the remaining English article details
    const remainingResult = await pool.query("SELECT id, title, content, source FROM news WHERE title !~ '[가-힣]'");
    console.log('\nRemaining English articles:');
    remainingResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Content: ${row.content?.substring(0, 100)}...`);
      console.log(`   Source: ${row.source}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllArticles();