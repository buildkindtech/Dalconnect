const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));
const { Pool } = require('pg');
const admin = require('firebase-admin');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env' });

const GMAPS_KEY = 'AIzaSyCAEESPAdfXjlgR-7bD2lKGjTLnbAaNlsQ';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/konnect-firebase-key.json')),
    storageBucket: 'konnect-ceedb.firebasestorage.app',
  });
}
const bucket = admin.storage().bucket();

const PLACES = [
  { place_id: 'ChIJn6ML0-QlTIYRQZrjHueuRKc', name_ko: '동천홍', name_en: 'Dong Chun Hong' },
  { place_id: 'ChIJXdqvSmkvTIYR1pa5QiMRthY', name_ko: '시온누들', name_en: 'ZION NOODLE' },
  { place_id: 'ChIJ_RYSBvslTIYR5EZhLw8Jaeg', name_ko: '홍콩반점', name_en: "Paik's Noodle" },
];

async function uploadPhoto(photoRef, bizId, idx) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GMAPS_KEY}`;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = `dallas/businesses/${bizId}/photo_${idx}.jpg`;
  const file = bucket.file(dest);
  await file.save(buf, { metadata: { contentType: 'image/jpeg' } });
  const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: new Date('2031-01-01') });
  return signedUrl;
}

async function main() {
  for (const p of PLACES) {
    console.log(`\n📍 ${p.name_ko} (${p.place_id})`);

    // 이미 DB에 있는지 확인
    const exists = await pool.query('SELECT id FROM businesses WHERE google_place_id=$1', [p.place_id]);
    if (exists.rows.length > 0) { console.log('  ⏭️ 이미 있음'); continue; }

    // Place Details 가져오기
    const detailRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,formatted_phone_number,rating,user_ratings_total,website,opening_hours,photos&key=${GMAPS_KEY}&language=ko`
    );
    const detail = (await detailRes.json()).result;
    console.log('  이름:', detail.name);
    console.log('  주소:', detail.formatted_address);
    console.log('  평점:', detail.rating, '/', detail.user_ratings_total);
    console.log('  사진:', detail.photos?.length || 0, '장');

    // 주소 파싱
    const addrParts = (detail.formatted_address || '').split(',');
    const city = addrParts[1]?.trim().split(' ')[0] || 'Carrollton';

    // 사진 최대 5장 업로드
    const bizId = uuidv4();
    const photoUrls = [];
    const photos = (detail.photos || []).slice(0, 5);
    for (let i = 0; i < photos.length; i++) {
      try {
        const url = await uploadPhoto(photos[i].photo_reference, bizId, i);
        photoUrls.push(url);
        process.stdout.write(`  📸 사진${i+1} ✅\n`);
      } catch(e) { console.log(`  📸 사진${i+1} 실패:`, e.message); }
    }

    // DB 저장
    await pool.query(`
      INSERT INTO businesses (id, name_en, name_ko, category, address, city, phone, website, rating, review_count, photos, featured, claimed, google_place_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
    `, [
      bizId, p.name_en, p.name_ko, '식당',
      detail.formatted_address || '',
      city,
      detail.formatted_phone_number || '',
      detail.website || '',
      detail.rating || null,
      detail.user_ratings_total || 0,
      JSON.stringify(photoUrls),
      true, false,
      p.place_id
    ]);
    console.log(`  ✅ DB 저장 완료 (${bizId})`);
  }
  await pool.end();
  console.log('\n🎉 완료!');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
