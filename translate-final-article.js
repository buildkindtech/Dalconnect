import pg from 'pg';

const DB_URL = 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({connectionString: DB_URL});

async function translateFinalArticle() {
  try {
    // Get the remaining English article
    const result = await pool.query("SELECT id, title, content, source FROM news WHERE title !~ '[가-힣]'");
    
    if (result.rows.length === 0) {
      console.log('✅ No English articles found - all articles are already in Korean!');
      return;
    }

    const article = result.rows[0];
    console.log('Translating final English article:');
    console.log(`Original Title: ${article.title}`);
    console.log(`Source: ${article.source}`);

    // Korean translations
    const koreanTitle = 'MLB 자유계약선수 동향: 2026시즌 스프링트레이닝 시작, 톱50 FA 선수들의 행선지';
    const koreanContent = 'MLB 비시즌이 막바지에 접어들면서 스프링트레이닝이 시작되었다. 거의 모든 주요 자유계약선수들이 새로운 팀을 찾았다. 2026시즌이 코앞으로 다가왔으며 팬들은 새로운 시즌에 대한 기대감으로 가득하다. 각 팀들은 보강된 전력으로 챔피언십을 향한 도전을 준비하고 있다.';

    console.log(`Korean Title: ${koreanTitle}`);
    console.log(`Korean Content: ${koreanContent}`);

    // Update the database
    await pool.query(
      'UPDATE news SET title = $1, content = $2 WHERE id = $3',
      [koreanTitle, koreanContent, article.id]
    );

    console.log('\n✅ Successfully translated final article!');

    // Verify completion
    const checkResult = await pool.query("SELECT count(*) FROM news WHERE title !~ '[가-힣]'");
    const remainingEnglish = parseInt(checkResult.rows[0].count);
    
    console.log(`\n🎯 Final verification:`);
    console.log(`Remaining English articles: ${remainingEnglish}`);
    
    if (remainingEnglish === 0) {
      console.log('🎉 SUCCESS! All articles are now in Korean!');
    } else {
      console.log('⚠️ Warning: Some English articles may still remain.');
    }

  } catch (error) {
    console.error('❌ Error during translation:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

translateFinalArticle();