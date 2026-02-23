import { db } from "../server/db";
import { businesses } from "../shared/schema";
import { sql, isNotNull } from "drizzle-orm";
import { Client } from "@googlemaps/google-maps-services-js";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';

/**
 * Fetch real business photos from Google Places API
 * Only for businesses with google_place_id
 */
async function fetchGooglePhotos() {
  console.log('📸 Fetching real business photos from Google Places API...\n');

  const client = new Client({});
  
  try {
    // Get all businesses with google_place_id
    const businessesWithPlaceId = await db
      .select({
        id: businesses.id,
        name: businesses.name_en,
        placeId: businesses.google_place_id
      })
      .from(businesses)
      .where(isNotNull(businesses.google_place_id))
      .limit(100); // Process in batches

    console.log(`Found ${businessesWithPlaceId.length} businesses with Google Place IDs\n`);

    let successCount = 0;
    let noPhotoCount = 0;
    let errorCount = 0;

    for (const business of businessesWithPlaceId) {
      try {
        console.log(`Processing: ${business.name}...`);
        
        // Fetch place details to get photos
        const response = await client.placeDetails({
          params: {
            place_id: business.placeId!,
            fields: ['photos'],
            key: GOOGLE_MAPS_API_KEY
          }
        });

        const photos = response.data.result.photos;

        if (photos && photos.length > 0) {
          // Get photo URLs (up to 5 photos)
          const photoUrls = photos.slice(0, 5).map(photo => {
            // Use the photo_reference to construct the URL
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
          });

          // Update business with real photos
          await db
            .update(businesses)
            .set({
              cover_url: photoUrls[0], // First photo as cover
              photos: photoUrls
            })
            .where(sql`${businesses.id} = ${business.id}`);

          console.log(`  ✅ Added ${photoUrls.length} photos`);
          successCount++;
        } else {
          console.log(`  ⚠️  No photos available - will use category icon`);
          noPhotoCount++;
        }

        // Rate limiting - Google Places API has strict limits
        await new Promise(resolve => setTimeout(resolve, 200)); // 5 requests/second

      } catch (error: any) {
        console.error(`  ❌ Error for ${business.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⚠️  No photos found: ${noPhotoCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n✨ Google Photos fetch complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

fetchGooglePhotos().then(() => process.exit(0)).catch(() => process.exit(1));
