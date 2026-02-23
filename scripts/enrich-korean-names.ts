import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Category-based Korean name mappings
const categoryKoreanDefaults: Record<string, string> = {
  'Restaurant': '한식당',
  'Korean Restaurant': '한식당',
  'BBQ': '한국 바베큐',
  'Church': '한인 교회',
  'Grocery Store': '한인 마트',
  'Beauty Salon': '미용실',
  'Hair Salon': '헤어살롱',
  'Medical': '병원',
  'Dental': '치과',
  'Real Estate': '부동산',
  'Law': '법률사무소',
  'Accounting': '회계사무소',
  'Auto Repair': '자동차 정비',
  'Education': '학원',
  'Tutoring': '과외',
  'Other': '기타 업체',
};

function isKorean(text: string): boolean {
  const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  return koreanRegex.test(text);
}

async function enrichKoreanNames() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🇰🇷 Enriching Korean names...');

    // Get all businesses
    const result = await pool.query('SELECT id, name_en, name_ko, category FROM businesses');
    const businesses = result.rows;
    
    let updated = 0;

    for (const business of businesses) {
      let newNameKo = business.name_ko;

      // If name_en contains Korean, copy it to name_ko
      if (!newNameKo && isKorean(business.name_en)) {
        newNameKo = business.name_en;
        console.log(`  📝 Copying Korean name: ${business.name_en}`);
      }
      // If name_ko is still empty, use category-based default
      else if (!newNameKo && business.category) {
        const defaultName = categoryKoreanDefaults[business.category];
        if (defaultName) {
          newNameKo = defaultName;
          console.log(`  🏷️  Setting default for ${business.name_en} (${business.category}) → ${defaultName}`);
        }
      }

      // Update if we have a new name_ko
      if (newNameKo && newNameKo !== business.name_ko) {
        await pool.query(
          'UPDATE businesses SET name_ko = $1 WHERE id = $2',
          [newNameKo, business.id]
        );
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} businesses with Korean names`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

enrichKoreanNames();
