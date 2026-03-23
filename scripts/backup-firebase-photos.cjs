/**
 * Firebase Storage 업소 사진 백업 → Google Drive (info@buildkind.tech / Konnect Backup 폴더)
 * + 로컬 backups/firebase/ 폴더에도 저장
 * 
 * 사용법: node scripts/backup-firebase-photos.cjs
 * 크론: 주 1회 일요일 4am
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SA_KEY = path.join(__dirname, '..', 'konnect-firebase-key.json');
const BUCKET_NAME = 'konnect-ceedb.firebasestorage.app';
const LOCAL_BACKUP = path.join(__dirname, '..', 'backups', 'firebase');

initializeApp({ credential: cert(require(SA_KEY)), storageBucket: BUCKET_NAME });
const bucket = getStorage().bucket();

async function run() {
  console.log('🔄 Firebase Storage 백업 시작...');
  
  // 1. 전체 파일 목록 가져오기
  const [files] = await bucket.getFiles({ maxResults: 10000 });
  console.log(`📁 총 ${files.length}개 파일 발견`);
  
  // 2. 메타데이터 저장 (파일명, 사이즈, URL 등)
  const metadata = files.map(f => ({
    name: f.name,
    size: parseInt(f.metadata.size || 0),
    contentType: f.metadata.contentType,
    created: f.metadata.timeCreated,
    updated: f.metadata.updated,
    md5: f.metadata.md5Hash,
  }));
  
  if (!fs.existsSync(LOCAL_BACKUP)) fs.mkdirSync(LOCAL_BACKUP, { recursive: true });
  
  const metaFile = path.join(LOCAL_BACKUP, 'firebase-manifest.json');
  fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
  console.log(`📋 매니페스트 저장: ${metadata.length}개 파일 기록`);
  
  // 3. 업소 사진만 로컬 다운로드 (businesses/ 폴더)
  const bizPhotos = files.filter(f => f.name.startsWith('dallas/businesses/'));
  console.log(`🏢 업소 사진: ${bizPhotos.length}개`);
  
  let downloaded = 0;
  let skipped = 0;
  
  for (const file of bizPhotos) {
    const localPath = path.join(LOCAL_BACKUP, file.name);
    const dir = path.dirname(localPath);
    
    // 이미 있으면 스킵 (증분 백업)
    if (fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      if (stat.size === parseInt(file.metadata.size || 0)) {
        skipped++;
        continue;
      }
    }
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    try {
      await file.download({ destination: localPath });
      downloaded++;
      if (downloaded % 50 === 0) console.log(`  ⬇️ ${downloaded}개 다운로드...`);
    } catch (e) {
      console.log(`  ⚠️ 실패: ${file.name} — ${e.message}`);
    }
  }
  
  console.log(`\n✅ 다운로드 완료: ${downloaded}개 새로, ${skipped}개 스킵`);
  
  // 4. 로컬 백업 사이즈 확인
  const totalSize = execSync(`du -sh ${LOCAL_BACKUP}`).toString().trim();
  console.log(`💾 로컬 백업 용량: ${totalSize.split('\t')[0]}`);
  
  // 5. DB 백업도 최신 것 Drive에 업로드
  const today = new Date().toISOString().slice(0,10);
  const dbBackup = path.join(__dirname, '..', 'backups', `dalconnect-backup-${today}.json`);
  
  // Drive 업로드 (gog CLI)
  try {
    // Konnect Backup 폴더 확인/생성
    const folderCheck = execSync(
      'gog drive ls --account info@buildkind.tech --parent root 2>/dev/null || echo ""',
      { encoding: 'utf8' }
    );
    
    let folderId;
    const match = folderCheck.match(/([a-zA-Z0-9_-]{25,})\s+Konnect Backup/);
    if (match) {
      folderId = match[1];
    } else {
      // 폴더 생성
      const createOut = execSync(
        'gog drive mkdir "Konnect Backup" --account info@buildkind.tech',
        { encoding: 'utf8' }
      );
      folderId = createOut.match(/([a-zA-Z0-9_-]{25,})/)?.[1];
    }
    
    if (folderId && fs.existsSync(dbBackup)) {
      console.log('\n📤 DB 백업 Drive 업로드 중...');
      execSync(
        `gog drive upload "${dbBackup}" --parent ${folderId} --account info@buildkind.tech`,
        { encoding: 'utf8' }
      );
      console.log('✅ DB 백업 Drive 업로드 완료');
    }
    
    // 매니페스트도 업로드
    if (folderId) {
      execSync(
        `gog drive upload "${metaFile}" --parent ${folderId} --account info@buildkind.tech`,
        { encoding: 'utf8' }
      );
      console.log('✅ 매니페스트 Drive 업로드 완료');
    }
  } catch (e) {
    console.log('⚠️ Drive 업로드 실패 (수동 확인 필요):', e.message?.slice(0,100));
  }
  
  console.log('\n🎉 백업 완료!');
}

run().catch(e => {
  console.error('❌ 백업 실패:', e.message);
  process.exit(1);
});
