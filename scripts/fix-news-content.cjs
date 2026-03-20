require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env' });
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });

function clean(c) {
  if (!c) return '';
  c = c.replace(/Credit:\s*[^.]+\.\s*/gi, '');
  c = c.replace(/Author:\s*[^\n.]+[\n.]?\s*/gi, '');
  c = c.replace(/Published:\s*[A-Z]{2}\s+CDT\s+\w+\s+\d+,\s*\d{4}\s*/gi, '');
  c = c.replace(/Updated:\s*[A-Z]{2}\s+CDT\s+\w+\s+\d+,\s*\d{4}\s*/gi, '');
  c = c.replace(/PHOTOS?:\s*/gi, '');
  c = c.replace(/\d+\/\d+\s+[A-Z][a-zA-Z\s]+by\s+[A-Z][a-zA-Z\s]+/g, '');
  c = c.replace(/Creative Captures by Her\s*/gi, '');
  c = c.replace(/\(AP\s*Photo\/[^)]+\)/gi, '');
  c = c.replace(/\(Reuters\)/gi, '');
  c = c.replace(/Sign up for[^.]+\./gi, '');
  c = c.replace(/Subscribe to[^.]+\./gi, '');
  return c.replace(/\s{2,}/g, ' ').trim();
}

async function main() {
  const r = await pool.query("SELECT id, content FROM news WHERE source IN ('WFAA','NBC DFW')");
  console.log('WFAA/NBC DFW 뉴스:', r.rows.length, '건');
  let updated = 0;
  for (const row of r.rows) {
    const cleaned = clean(row.content);
    if (cleaned !== row.content) {
      await pool.query('UPDATE news SET content=$1 WHERE id=$2', [cleaned, row.id]);
      updated++;
    }
  }
  console.log('업데이트 완료:', updated, '건');
  pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
