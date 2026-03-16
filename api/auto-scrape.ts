import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED = ['https://dalkonnect.com','https://www.dalkonnect.com','https://dalconnect.buildkind.tech','http://localhost:5000','http://localhost:5173'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // auto-scrape는 관리자 전용 — 프로덕션에서는 비활성화
  return res.json({ success: false, message: '프로덕션에서는 auto-scrape를 사용할 수 없습니다. 로컬 서버에서 실행하세요.' });
}
