import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require' 
});

try {
  await client.connect();
  // Check columns first
  const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'news' ORDER BY ordinal_position`);
  console.log('COLUMNS:', cols.rows.map(r => r.column_name));
  
  const res = await client.query(`
    SELECT * FROM news 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
} catch (err) {
  console.error('Error:', err.message);
  try { await client.end(); } catch(e) {}
}
