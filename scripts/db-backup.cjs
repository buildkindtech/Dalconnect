#!/usr/bin/env node
/**
 * DalKonnect DB Backup — Neon → 로컬 JSON dump
 * 매일 크론으로 실행하여 DB 데이터 로컬 백업
 */
require('dotenv').config();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 15000,
  });

  const tables = [
    'businesses', 'news', 'blogs', 'charts',
    'community_posts', 'community_comments', 'community_trends',
    'deals', 'listings', 'newsletter_subscribers',
  ];

  const timestamp = new Date().toISOString().slice(0, 10);
  const backupData = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      backupData[table] = result.rows;
      totalRows += result.rows.length;
      console.log(`  ✅ ${table}: ${result.rows.length}건`);
    } catch (e) {
      console.log(`  ⚠️ ${table}: ${e.message}`);
      backupData[table] = [];
    }
  }

  const filename = `dalconnect-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

  // 7일 이상 된 백업 삭제
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('dalconnect-backup-'));
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const f of files) {
    const match = f.match(/dalconnect-backup-(\d{4}-\d{2}-\d{2})\.json/);
    if (match && new Date(match[1]).getTime() < cutoff) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`  🗑️ 오래된 백업 삭제: ${f}`);
    }
  }

  console.log(`\n✅ 백업 완료: ${filename} (${totalRows}건, ${(fs.statSync(filepath).size / 1024).toFixed(0)}KB)`);
  await pool.end();
}

backup().catch(e => { console.error('❌ 백업 실패:', e.message); process.exit(1); });
