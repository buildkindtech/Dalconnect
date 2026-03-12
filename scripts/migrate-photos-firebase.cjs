/**
 * Migrate Google Places photos → Firebase Storage
 * Downloads all business photos, uploads to Firebase, updates DB URLs
 * Run once, then disable Google Places API
 */
require('dotenv/config');
const admin = require('firebase-admin');
const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const path = require('path');

// Firebase init
const serviceAccount = require('../konnect-firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'konnect-ceedb.firebasestorage.app'
});
const bucket = admin.storage().bucket();

// DB init
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CONCURRENCY = 5;
const DELAY_MS = 200; // Be nice to Google API

let stats = { total: 0, success: 0, failed: 0, skipped: 0 };

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const handler = (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        const location = res.headers.location;
        if (location) {
          const mod = location.startsWith('https') ? https : http;
          mod.get(location, (res2) => {
            const chunks = [];
            res2.on('data', c => chunks.push(c));
            res2.on('end', () => resolve(Buffer.concat(chunks)));
            res2.on('error', reject);
          }).on('error', reject);
        } else {
          reject(new Error('Redirect without location'));
        }
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    };
    https.get(url, handler).on('error', reject);
  });
}

async function uploadToFirebase(buffer, filePath) {
  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    }
  });
  // Use signed URL (uniform bucket access enabled)
  const [url] = await file.getSignedUrl({ action: 'read', expires: '2030-12-31' });
  return url;
}

function extractPhotoUrl(url) {
  // Replace old key with current key if needed
  if (url.includes('key=')) {
    url = url.replace(/key=[^&]+/, `key=${API_KEY}`);
  }
  return url;
}

async function processBusiness(biz) {
  const { id, name_ko, name_en, cover_url, photos } = biz;
  const name = name_ko || name_en || id;
  let updated = false;
  
  // Process cover_url
  if (cover_url && cover_url.includes('places.googleapis.com')) {
    try {
      const url = extractPhotoUrl(cover_url);
      const buffer = await fetchImage(url);
      if (buffer.length > 1000) { // Valid image
        const fbPath = `dallas/businesses/${id}/cover.jpg`;
        const publicUrl = await uploadToFirebase(buffer, fbPath);
        await pool.query('UPDATE businesses SET cover_url = $1 WHERE id = $2', [publicUrl, id]);
        updated = true;
      }
    } catch (e) {
      console.error(`  ❌ cover ${name}: ${e.message}`);
    }
  }
  
  // Process photos array
  if (photos && Array.isArray(photos) && photos.length > 0) {
    const newPhotos = [];
    for (let i = 0; i < photos.length && i < 5; i++) { // Max 5 photos per business
      const photoUrl = photos[i];
      if (typeof photoUrl === 'string' && photoUrl.includes('places.googleapis.com')) {
        try {
          const url = extractPhotoUrl(photoUrl);
          const buffer = await fetchImage(url);
          if (buffer.length > 1000) {
            const fbPath = `dallas/businesses/${id}/photo_${i}.jpg`;
            const publicUrl = await uploadToFirebase(buffer, fbPath);
            newPhotos.push(publicUrl);
          } else {
            newPhotos.push(photoUrl); // Keep original if download failed
          }
        } catch (e) {
          newPhotos.push(photoUrl);
        }
      } else {
        newPhotos.push(photoUrl); // Non-Google URL, keep as is
      }
    }
    if (newPhotos.some(u => u.includes('storage.googleapis.com'))) {
      await pool.query('UPDATE businesses SET photos = $1 WHERE id = $2', [JSON.stringify(newPhotos), id]);
      updated = true;
    }
  }
  
  return updated;
}

async function processChunk(businesses) {
  const results = await Promise.allSettled(
    businesses.map(biz => processBusiness(biz))
  );
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) stats.success++;
    else if (r.status === 'rejected') stats.failed++;
    else stats.skipped++;
  });
}

async function main() {
  console.log('🚀 Google Photos → Firebase 마이그레이션 시작\n');
  
  // Get all businesses with Google Places URLs
  const { rows } = await pool.query(`
    SELECT id, name_ko, name_en, cover_url, photos 
    FROM businesses 
    WHERE cover_url LIKE '%places.googleapis.com%' 
       OR photos::text LIKE '%places.googleapis.com%'
    ORDER BY id
  `);
  
  stats.total = rows.length;
  console.log(`📦 대상: ${stats.total}개 업소\n`);
  
  // Process in chunks
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    const names = chunk.map(b => (b.name_ko || b.name_en || '').substring(0, 20)).join(', ');
    process.stdout.write(`[${i+1}-${Math.min(i+CONCURRENCY, rows.length)}/${rows.length}] ${names}...`);
    
    await processChunk(chunk);
    console.log(` ✅ ${stats.success}/${stats.total}`);
    
    if (i + CONCURRENCY < rows.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log(`\n📊 결과:`);
  console.log(`  ✅ 성공: ${stats.success}`);
  console.log(`  ❌ 실패: ${stats.failed}`);
  console.log(`  ⏭️ 스킵: ${stats.skipped}`);
  console.log(`\n🎉 완료! 이제 Google Places API 키를 끄세요.`);
  
  await pool.end();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
