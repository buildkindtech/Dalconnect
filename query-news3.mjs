import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require' 
});

try {
  await client.connect();
  
  // Get diverse top news from various categories - prioritize local, 달라스, 한국뉴스, 미국뉴스
  const res = await client.query(`
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '로컬뉴스' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '달라스' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '한국뉴스' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '미국뉴스' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '이민/비자' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '취업/사업' ORDER BY published_date DESC LIMIT 1)
    UNION ALL
    (SELECT id, title, content, category, published_date, source, city FROM news 
     WHERE category = '세금/재정' ORDER BY published_date DESC LIMIT 1)
    ORDER BY published_date DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
} catch (err) {
  console.error('Error:', err.message);
  try { await client.end(); } catch(e) {}
}
