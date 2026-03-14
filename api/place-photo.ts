import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com',
  'https://www.dalkonnect.com',
  'https://dalconnect.com',
  'https://www.dalconnect.com',
  'https://dalconnect.buildkind.tech',
  'https://dalconnect.vercel.app',
  'http://localhost:5000',
  'http://localhost:5050',
  'http://localhost:5173',
];

/**
 * Google Places Photo Proxy
 * Proxies Google Places photo requests server-side to avoid API key domain restrictions.
 * Usage: /api/place-photo?ref=places/{placeId}/photos/{photoRef}/media&maxWidth=800&maxHeight=800
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — 허용된 도메인만 (이전: * 와일드카드 → 보안 취약)
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // 허용되지 않은 도메인 → 차단
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API 키 — 반드시 환경변수에서만 (하드코딩 금지)
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY not configured');
    return res.status(500).json({ error: 'Photo service not configured' });
  }

  const { ref, maxWidth, maxHeight } = req.query;

  if (!ref || typeof ref !== 'string') {
    return res.status(400).json({ error: 'Missing ref parameter' });
  }

  // ref 형식 검증: "places/{id}/photos/{ref}/media" 만 허용
  if (!ref.startsWith('places/') || !ref.includes('/photos/') || !ref.endsWith('/media')) {
    return res.status(400).json({ error: 'Invalid ref format' });
  }

  // maxWidth/Height 범위 제한 (봇이 과도한 크기 요청 방지)
  const width = Math.min(parseInt(maxWidth as string) || 800, 1600);
  const height = Math.min(parseInt(maxHeight as string) || 800, 1600);

  const googleUrl = `https://places.googleapis.com/v1/${ref}?maxHeightPx=${height}&maxWidthPx=${width}&key=${API_KEY}`;

  try {
    const response = await fetch(googleUrl, {
      headers: { 'Accept': 'image/*' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Google API returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('CDN-Cache-Control', 'public, max-age=604800');

    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Place photo proxy error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch photo' });
  }
}
