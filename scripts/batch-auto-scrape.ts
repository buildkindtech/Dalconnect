import { db } from '../server/db';
import { searchLogs, businesses } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

interface Place {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
  primaryType?: string;
}

async function batchAutoScrape() {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not set');
    }

    console.log('🔍 Starting batch auto-scrape...\n');

    // Get all unique search queries with 0 results
    const zeroResultQueries = await db
      .select({
        query: searchLogs.query,
        count: sql<number>`count(*)::int`
      })
      .from(searchLogs)
      .where(eq(searchLogs.results_count, 0))
      .groupBy(searchLogs.query)
      .orderBy(sql`count(*) DESC`)
      .limit(20); // Process top 20 most searched queries with no results

    console.log(`Found ${zeroResultQueries.length} queries with zero results\n`);

    if (zeroResultQueries.length === 0) {
      console.log('✅ No queries to process. Exiting.');
      process.exit(0);
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const { query, count } of zeroResultQueries) {
      console.log(`\n📝 Processing: "${query}" (searched ${count} times)`);

      try {
        // Call Google Places API
        const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
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
          console.error(`  ❌ Google API error: ${placesResponse.statusText}`);
          continue;
        }

        const placesData = await placesResponse.json();
        const places: Place[] = placesData.places || [];

        console.log(`  Found ${places.length} places from Google`);

        if (places.length === 0) {
          continue;
        }

        let addedCount = 0;
        let skippedCount = 0;

        for (const place of places) {
          const googlePlaceId = place.id;

          // Check if already exists
          const existingBusiness = await db
            .select()
            .from(businesses)
            .where(eq(businesses.google_place_id, googlePlaceId))
            .limit(1);

          if (existingBusiness.length > 0) {
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
          await db.insert(businesses).values({
            name_en: place.displayName?.text || 'Unknown',
            name_ko: place.displayName?.text || null,
            category,
            address,
            city,
            phone: place.nationalPhoneNumber || null,
            website: place.websiteUri || null,
            rating: place.rating ? place.rating.toFixed(1) : null,
            review_count: place.userRatingCount || 0,
            google_place_id: googlePlaceId,
            tier: 'free',
            featured: false,
            claimed: false
          });

          addedCount++;
          console.log(`  ✓ Added: ${place.displayName?.text} (${category})`);
        }

        totalAdded += addedCount;
        totalSkipped += skippedCount;

        console.log(`  Summary: ${addedCount} added, ${skippedCount} skipped`);

        // Wait 1 second between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error processing "${query}":`, error);
      }
    }

    console.log(`\n\n🎉 Batch auto-scrape complete!`);
    console.log(`Total added: ${totalAdded}`);
    console.log(`Total skipped: ${totalSkipped}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Batch auto-scrape failed:', error);
    process.exit(1);
  }
}

batchAutoScrape();
