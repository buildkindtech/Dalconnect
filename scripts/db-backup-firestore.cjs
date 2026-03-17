#!/usr/bin/env node
/**
 * DalKonnect DB Backup — Neon → Firestore 미러
 * 매일 로컬 백업과 함께 Firestore에도 복제
 */
require('dotenv').config();
const pg = require('pg');
const admin = require('firebase-admin');
const sa = require('../konnect-firebase-key.json');

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const firestore = admin.firestore();

const DATABASE_URL = process.env.DATABASE_URL;
const TABLES = ['businesses', 'news', 'blogs', 'charts', 'community_posts', 'community_comments', 'deals', 'listings'];
const BATCH_SIZE = 400; // Firestore batch limit = 500

async function backup() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 15000,
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      const rows = result.rows;
      totalRows += rows.length;

      // Firestore에 배치 쓰기
      const collRef = firestore.collection(`backup_${table}`);
      
      // 기존 백업 삭제 (이전 데이터)
      const existing = await collRef.listDocuments();
      const delBatches = [];
      for (let i = 0; i < existing.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        existing.slice(i, i + BATCH_SIZE).forEach(doc => batch.delete(doc));
        delBatches.push(batch.commit());
      }
      await Promise.all(delBatches);

      // 새 데이터 쓰기
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        rows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          // Firestore는 undefined 값 허용 안 함 — null로 변환
          const clean = {};
          for (const [k, v] of Object.entries(row)) {
            clean[k] = v === undefined ? null : (v instanceof Date ? v.toISOString() : v);
          }
          const docRef = collRef.doc(String(row.id || `row_${i + idx}`));
          batch.set(docRef, clean);
        });
        await batch.commit();
      }

      console.log(`  ✅ ${table}: ${rows.length}건 → Firestore`);
    } catch (e) {
      console.log(`  ⚠️ ${table}: ${e.message}`);
    }
  }

  // 메타데이터 저장
  await firestore.collection('_backup_meta').doc('latest').set({
    timestamp: new Date().toISOString(),
    date: timestamp,
    totalRows,
    tables: TABLES,
  });

  console.log(`\n✅ Firestore 백업 완료: ${totalRows}건 (${timestamp})`);
  await pool.end();
}

backup().catch(e => { console.error('❌ 백업 실패:', e.message); process.exit(1); });
