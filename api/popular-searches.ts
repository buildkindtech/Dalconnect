import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED = ['https://dalkonnect.com','https://www.dalkonnect.com','https://dalconnect.buildkind.tech','http://localhost:5000','http://localhost:5173'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 인기 검색어 정적 목록 (향후 DB에서 집계)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
  return res.json({
    searches: [
      { term: '한인 식당', count: 45 },
      { term: '미용실', count: 38 },
      { term: '치과', count: 32 },
      { term: '부동산', count: 28 },
      { term: '이사', count: 25 },
      { term: '세무사', count: 22 },
      { term: '보험', count: 20 },
      { term: '자동차 정비', count: 18 },
    ],
  });
}
