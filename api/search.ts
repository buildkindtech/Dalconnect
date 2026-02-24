import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      const { q, city } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query 'q' is required" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      const searchPattern = `%${q}%`;
      // Default to dallas if no city specified (backward compatibility)
      const targetCity = city || 'dallas';

      // Search businesses
      const businessQuery = `
        SELECT * FROM businesses 
        WHERE (name_en ILIKE $1 OR name_ko ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
        AND city = $2
        ORDER BY rating DESC NULLS LAST
        LIMIT 20
      `;
      let businessResult = await pool.query(businessQuery, [searchPattern, targetCity]);

      // Auto-scrape from Google Places if 0 results
      if (businessResult.rowCount === 0 && process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;
          
          // Different search location based on city
          const locationConfig = targetCity === 'austin' 
            ? { center: { latitude: 30.2672, longitude: -97.7431 }, radius: 25000, searchArea: 'Austin TX' }
            : { center: { latitude: 32.95, longitude: -96.89 }, radius: 50000, searchArea: 'Dallas Fort Worth TX' };
          
          const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours'
            },
            body: JSON.stringify({
              textQuery: `${q} ${locationConfig.searchArea}`,
              locationBias: { circle: locationConfig },
              maxResultCount: 5
            })
          });
          const gData = await gRes.json();
          if (gData.places?.length > 0) {
            for (const p of gData.places) {
              const addr = p.formattedAddress || '';
              if (!addr.includes('TX')) continue;
              const existCheck = await pool.query('SELECT id FROM businesses WHERE google_place_id = $1', [p.id]);
              if (existCheck.rowCount && existCheck.rowCount > 0) continue;
              const name = p.displayName?.text || '';
              const cityMatch = addr.match(/,\s*([^,]+),\s*TX/);
              const extractedCity = cityMatch ? cityMatch[1].trim() : (targetCity === 'austin' ? 'Austin' : 'Dallas');
              await pool.query(
                `INSERT INTO businesses (id, name_en, category, address, city, phone, website, rating, review_count, google_place_id, tier)
                 VALUES (gen_random_uuid(), $1, '기타', $2, $3, $4, $5, $6, $7, $8, 'free')
                 ON CONFLICT (google_place_id) DO NOTHING`,
                [name, addr, targetCity, p.nationalPhoneNumber || null, p.websiteUri || null, p.rating || 0, p.userRatingCount || 0, p.id]
              );
            }
            // Re-search
            businessResult = await pool.query(businessQuery, [searchPattern]);
          }
        } catch (e) { /* auto-scrape failed silently */ }
      }

      // Log search
      try {
        await pool.query('INSERT INTO search_logs (id, query, results_count) VALUES (gen_random_uuid(), $1, $2)', [q, businessResult.rowCount]);
      } catch(e) {}

      // Search news
      const newsQuery = `
        SELECT * FROM news 
        WHERE (title ILIKE $1 OR content ILIKE $1)
        AND city = $2
        ORDER BY published_date DESC NULLS LAST
        LIMIT 10
      `;
      const newsResult = await pool.query(newsQuery, [searchPattern, targetCity]);

      await pool.end();
      
      return res.status(200).json({
        businesses: businessResult.rows,
        news: newsResult.rows,
        query: q
      });
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
