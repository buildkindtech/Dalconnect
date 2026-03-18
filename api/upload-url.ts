import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com', 'https://www.dalkonnect.com',
  'https://dalconnect.com', 'https://dalconnect.buildkind.tech',
  'http://localhost:5000', 'http://localhost:5173', 'http://localhost:5002',
];

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

// Firebase Admin 싱글톤
if (!admin.apps.length) {
  const keyPath = process.env.FIREBASE_KEY_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_KEY_PATH)
    : path.resolve(process.cwd(), 'konnect-firebase-key.json');

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'konnect-ceedb.firebasestorage.app',
    });
  } catch {
    // 환경변수 방식 fallback
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: 'konnect-ceedb.firebasestorage.app',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contentType, size } = req.body || {};

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: '이미지 파일만 업로드 가능합니다 (JPEG, PNG, WebP, GIF)' });
  }

  if (size && size > MAX_SIZE_MB * 1024 * 1024) {
    return res.status(400).json({ error: `파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다` });
  }

  try {
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const filename = `market/${uuidv4()}.${ext}`;

    const bucket = admin.storage().bucket();
    const file = bucket.file(filename);

    // Signed URL 생성 (15분 유효)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    // 공개 다운로드 URL (업로드 완료 후 사용)
    const publicUrl = `https://storage.googleapis.com/konnect-ceedb.firebasestorage.app/${filename}`;

    return res.json({ uploadUrl, publicUrl, filename });
  } catch (err: any) {
    console.error('Firebase Signed URL error:', err);
    return res.status(500).json({ error: '업로드 URL 생성 실패' });
  }
}
