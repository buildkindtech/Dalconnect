import pg from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const { Pool } = pg;
const BASE_URL = 'https://dalconnect.buildkind.tech';

async function generateSitemap() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🗺️  Generating sitemap...');

    // Get all businesses
    const businessesResult = await pool.query(
      'SELECT id, updated_at FROM businesses ORDER BY id'
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Static Pages -->
  <url>
    <loc>${BASE_URL}/businesses</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/news</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Business Pages -->
${businessesResult.rows.map(business => `  <url>
    <loc>${BASE_URL}/business/${business.id}</loc>
    <lastmod>${new Date(business.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to public folder (for Vite/Vercel static serving)
    const publicPath = './public/sitemap.xml';
    fs.writeFileSync(publicPath, sitemap);
    console.log(`✅ Sitemap generated: ${publicPath}`);
    console.log(`📊 Total URLs: ${businessesResult.rows.length + 6}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

generateSitemap();
