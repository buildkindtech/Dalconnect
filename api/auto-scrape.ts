import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY not set" });
      }

      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      console.log(`Auto-scraping for query: "${query}"`);

      // Call Google Places API (New)
      const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.types,places.primaryType'
        },
        body: JSON.stringify({
          textQuery: `${query} korean 달라스 프리스코 앨런 플레이노`,
          languageCode: 'ko',
          locationBias: {
            circle: {
              center: {
                latitude: 32.7767,
                longitude: -96.7970
              },
              radius: 80000.0 // 80km radius around Dallas
            }
          },
          maxResultCount: 10
        })
      });

      if (!placesResponse.ok) {
        const errorText = await placesResponse.text();
        console.error('Google Places API error:', errorText);
        return res.status(500).json({ 
          error: 'Failed to fetch from Google Places API',
          details: errorText
        });
      }

      const placesData = await placesResponse.json();
      const places = placesData.places || [];

      console.log(`Found ${places.length} places from Google`);

      let addedCount = 0;
      let skippedCount = 0;
      const addedBusinesses = [];

      for (const place of places) {
        const googlePlaceId = place.id;
        
        // Check if already exists
        const existingCheck = await pool.query(
          'SELECT id FROM businesses WHERE google_place_id = $1',
          [googlePlaceId]
        );

        if (existingCheck.rows.length > 0) {
          console.log(`Skipping existing business: ${place.displayName?.text}`);
          skippedCount++;
          continue;
        }

        // Determine category from types
        const types = place.types || [];
        const primaryType = place.primaryType || '';
        let category = '기타';

        if (types.includes('restaurant') || primaryType === 'restaurant') {
          category = 'Korean Restaurant';
        } else if (types.includes('church') || primaryType === 'church') {
          category = '교회';
        } else if (types.includes('doctor') || types.includes('hospital') || primaryType === 'hospital') {
          category = '병원';
        } else if (types.includes('hair_care') || types.includes('beauty_salon') || primaryType === 'beauty_salon') {
          category = '미용실';
        } else if (types.includes('real_estate_agency') || primaryType === 'real_estate_agency') {
          category = '부동산';
        } else if (types.includes('car_dealer') || types.includes('car_repair') || primaryType === 'car_dealer') {
          category = '자동차';
        } else if (types.includes('school') || types.includes('tutoring') || primaryType === 'school') {
          category = '학원';
        } else if (types.includes('supermarket') || types.includes('grocery_store') || primaryType === 'supermarket') {
          category = '한인마트';
        } else if (types.includes('lawyer') || types.includes('accounting') || primaryType === 'lawyer') {
          category = '법률/회계';
        }

        // Extract city from address
        const address = place.formattedAddress || '';
        let city = '';
        const dallasSuburbs = ['Plano', 'Frisco', 'Allen', 'McKinney', 'Carrollton', 'Irving', 'Richardson', 'Garland', 'Mesquite', 'Dallas'];
        for (const suburb of dallasSuburbs) {
          if (address.includes(suburb)) {
            city = suburb;
            break;
          }
        }

        // Insert new business
        const insertQuery = `
          INSERT INTO businesses (
            name_en,
            name_ko,
            category,
            address,
            city,
            phone,
            website,
            rating,
            review_count,
            google_place_id,
            tier,
            featured,
            claimed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;

        const insertParams = [
          place.displayName?.text || 'Unknown',
          place.displayName?.text || null,
          category,
          address,
          city,
          place.nationalPhoneNumber || null,
          place.websiteUri || null,
          place.rating ? place.rating.toFixed(1) : null,
          place.userRatingCount || 0,
          googlePlaceId,
          'free',
          false,
          false
        ];

        const insertResult = await pool.query(insertQuery, insertParams);
        const newBusiness = insertResult.rows[0];
        
        addedBusinesses.push(newBusiness);
        addedCount++;
        console.log(`✓ Added: ${place.displayName?.text} (${category})`);
      }

      await pool.end();

      return res.status(200).json({
        success: true,
        query,
        found: places.length,
        added: addedCount,
        skipped: skippedCount,
        businesses: addedBusinesses
      });

    } catch (error: any) {
      console.error('Auto-scrape error:', error);
      return res.status(500).json({ 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
