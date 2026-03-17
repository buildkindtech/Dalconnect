/**
 * 포스팅 백업 헬퍼
 * 사용법: savePost({ date, type, igId, fbId, images, caption })
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'sns-cards', 'posted');

function savePost({ date, type, igId, fbId, images, caption }) {
  const dir = path.join(BASE, date);
  fs.mkdirSync(dir, { recursive: true });

  const postsFile = path.join(dir, 'posts.json');
  let posts = [];
  if (fs.existsSync(postsFile)) {
    try { posts = JSON.parse(fs.readFileSync(postsFile, 'utf8')); } catch {}
  }

  const id = 'post_' + String(posts.length + 1).padStart(3, '0');
  const imageList = Array.isArray(images) ? images : [images];

  // 이미지 파일 복사
  const savedImages = [];
  for (const imgPath of imageList) {
    if (!imgPath || !fs.existsSync(imgPath)) continue;
    const dest = path.join(dir, path.basename(imgPath));
    if (imgPath !== dest) fs.copyFileSync(imgPath, dest);
    savedImages.push(path.basename(imgPath));
  }

  const entry = {
    id, date, type: type || 'single',
    ig_id: igId, fb_id: fbId,
    ...(savedImages.length === 1 ? { image: savedImages[0] } : { images: savedImages }),
    caption,
    saved_at: new Date().toISOString()
  };

  posts.push(entry);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
  console.log(`📁 백업 저장: ${dir}/${savedImages.join(', ')}`);
  return entry;
}

module.exports = { savePost };
