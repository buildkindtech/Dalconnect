#!/usr/bin/env node
/**
 * cleanup-old-news.cjs
 * 90일 지난 뉴스 자동 삭제
 * 크론: 매일 새벽 2am CST
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const RETENTION_DAYS = 90;

async function cleanup() {
  console.log(`[cleanup] Starting — removing news older than ${RETENTION_DAYS} days...`);

  // Count before
  const before = await sql`SELECT count(*) as cnt FROM news`;
  console.log(`[cleanup] Current total: ${before[0].cnt}`);

  // Count targets
  const targets = await sql`SELECT count(*) as cnt FROM news WHERE created_at < NOW() - INTERVAL '90 days'`;
  const targetCount = parseInt(targets[0].cnt);
  console.log(`[cleanup] Found ${targetCount} news older than ${RETENTION_DAYS} days`);

  if (targetCount === 0) {
    console.log('[cleanup] Nothing to delete. Done.');
    return { deleted: 0, remaining: parseInt(before[0].cnt) };
  }

  // Delete
  const deleted = await sql`DELETE FROM news WHERE created_at < NOW() - INTERVAL '90 days'`;
  
  // Count after
  const after = await sql`SELECT count(*) as cnt FROM news`;
  const remaining = parseInt(after[0].cnt);
  const actualDeleted = parseInt(before[0].cnt) - remaining;

  console.log(`[cleanup] Deleted: ${actualDeleted} | Remaining: ${remaining}`);

  // DB size after
  const size = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size`;
  console.log(`[cleanup] DB size: ${size[0].db_size}`);

  return { deleted: actualDeleted, remaining };
}

cleanup()
  .then(r => {
    console.log(`[cleanup] Done — ${r.deleted} deleted, ${r.remaining} remaining`);
    process.exit(0);
  })
  .catch(err => {
    console.error('[cleanup] Error:', err.message);
    process.exit(1);
  });
