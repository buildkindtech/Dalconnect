import pkg from 'pg';
const { Pool } = pkg;

// DB 연결 설정
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// 카테고리별 기사 조회 및 확장
async function expandContentForCategories() {
  const categories = ['K-POP', '연예/드라마', '스포츠', '패션/뷰티', '건강', '육아'];
  
  try {
    for (const category of categories) {
      console.log(`\n=== Processing category: ${category} ===`);
      
      // 카테고리별 기사 조회
      const result = await pool.query(
        'SELECT id, title, content, original_url FROM news WHERE category = $1 AND content IS NOT NULL ORDER BY created_at DESC LIMIT 10',
        [category]
      );
      
      console.log(`Found ${result.rows.length} articles in ${category}`);
      
      for (const article of result.rows) {
        const currentLength = article.content?.length || 0;
        console.log(`\nArticle ID: ${article.id}`);
        console.log(`Title: ${article.title}`);
        console.log(`Current content length: ${currentLength} chars`);
        console.log(`Original URL: ${article.original_url || 'None'}`);
        console.log(`Current content: ${article.content?.substring(0, 100)}...`);
        
        // 500자 미만인 경우만 확장
        if (currentLength < 500) {
          console.log(`✓ Will expand this article (current: ${currentLength} chars)`);
        } else {
          console.log(`× Already long enough (${currentLength} chars)`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 짧은 기사 조회
async function findShortArticles() {
  try {
    console.log('\n=== Finding short articles (< 100 chars) ===');
    
    const result = await pool.query(
      `SELECT id, title, content, category, original_url 
       FROM news 
       WHERE LENGTH(content) < 100 AND content IS NOT NULL
       ORDER BY created_at DESC 
       LIMIT 25`
    );
    
    console.log(`Found ${result.rows.length} short articles`);
    
    for (const article of result.rows) {
      console.log(`\nID: ${article.id} | Category: ${article.category} | Length: ${article.content?.length || 0}`);
      console.log(`Title: ${article.title}`);
      console.log(`Content: ${article.content}`);
      console.log(`URL: ${article.original_url || 'None'}`);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('Starting news content expansion...');
  
  // 1. 카테고리별 기사 조회
  await expandContentForCategories();
  
  // 2. 짧은 기사 조회
  await findShortArticles();
  
  await pool.end();
}

main();