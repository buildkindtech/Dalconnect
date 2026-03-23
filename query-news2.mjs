import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require' 
});

try {
  await client.connect();
  
  // Check distinct categories
  const cats = await client.query(`SELECT DISTINCT category, count(*) as cnt FROM news GROUP BY category ORDER BY cnt DESC`);
  console.log('CATEGORIES:', JSON.stringify(cats.rows));
  
  // Get diverse top news from today/recent
  const res = await client.query(`
    SELECT id, title, content, category, published_date, source, city
    FROM news 
    WHERE published_date >= NOW() - INTERVAL '48 hours'
    ORDER BY published_date DESC 
    LIMIT 10
  `);
  console.log('RECENT NEWS COUNT:', res.rows.length);
  console.log(JSON.stringify(res.rows.map(r => ({id: r.id, title: r.title, category: r.category, source: r.source})), null, 2));
  await client.end();
} catch (err) {
  console.error('Error:', err.message);
  try { await client.end(); } catch(e) {}
}
