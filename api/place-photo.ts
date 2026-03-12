import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Google Places Photo Proxy
 * Proxies Google Places photo requests server-side to avoid API key domain restrictions.
 * 
 * Usage: /api/place-photo?ref=places/{placeId}/photos/{photoRef}/media&maxWidth=800&maxHeight=800
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ref, maxWidth, maxHeight } = req.query;

  if (!ref || typeof ref !== 'string') {
    return res.status(400).json({ error: 'Missing ref parameter' });
  }

  // Validate ref format: should look like "places/{id}/photos/{ref}/media"
  if (!ref.startsWith('places/') || !ref.includes('/photos/')) {
    return res.status(400).json({ error: 'Invalid ref format' });
  }

  const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';
  const width = parseInt(maxWidth as string) || 800;
  const height = parseInt(maxHeight as string) || 800;

  const googleUrl = `https://places.googleapis.com/v1/${ref}?maxHeightPx=${height}&maxWidthPx=${width}&key=${API_KEY}`;

  try {
    const response = await fetch(googleUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Google API returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Cache for 7 days (images don't change)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('CDN-Cache-Control', 'public, max-age=604800');
    
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Place photo proxy error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch photo' });
  }
}
