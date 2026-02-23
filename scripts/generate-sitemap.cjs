/**
 * Generate dynamic sitemap.xml from database
 * Includes: homepage, static pages, all businesses, all blog posts, all categories
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const BASE_URL = 'https://dalconnect.buildkind.tech';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Categories in the system
const CATEGORIES = [
  'restaurants',
  'markets',
  'beauty',
  'health',
  'professional',
  'education',
  'religion',
  'automotive',
  'shopping',
  'entertainment',
  'other'
];

async function generateSitemap() {
  console.log('🗺️  Generating dynamic sitemap...');
  
  try {
    // Fetch all businesses
    const businessesResult = await pool.query(
      'SELECT id, updated_at FROM businesses ORDER BY updated_at DESC'
    );
    
    // Fetch all blog posts
    const blogsResult = await pool.query(
      'SELECT slug, updated_at FROM blogs WHERE published_at <= NOW() ORDER BY updated_at DESC'
    );
    
    // Fetch all unique cities
    const citiesResult = await pool.query(
      "SELECT DISTINCT city FROM businesses WHERE city IS NOT NULL AND city != '' ORDER BY city"
    );
    
    console.log(`✅ Found ${businessesResult.rows.length} businesses`);
    console.log(`✅ Found ${blogsResult.rows.length} blog posts`);
    console.log(`✅ Found ${citiesResult.rows.length} cities`);
    
    // Build sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    sitemap += generateUrlEntry(BASE_URL, new Date(), 'daily', '1.0');
    
    // Static pages
    const staticPages = [
      { path: '/businesses', priority: '0.9' },
      { path: '/blog', priority: '0.8' },
      { path: '/news', priority: '0.8' },
      { path: '/marketplace', priority: '0.8' },
      { path: '/about', priority: '0.5' },
      { path: '/contact', priority: '0.5' },
      { path: '/pricing', priority: '0.7' },
    ];
    
    staticPages.forEach(page => {
      sitemap += generateUrlEntry(
        `${BASE_URL}${page.path}`,
        new Date(),
        'weekly',
        page.priority
      );
    });
    
    // Category pages
    CATEGORIES.forEach(category => {
      sitemap += generateUrlEntry(
        `${BASE_URL}/businesses?category=${category}`,
        new Date(),
        'daily',
        '0.8'
      );
    });
    
    // City pages
    citiesResult.rows.forEach(row => {
      const city = row.city.toLowerCase().replace(/\s+/g, '-');
      sitemap += generateUrlEntry(
        `${BASE_URL}/businesses?city=${encodeURIComponent(row.city)}`,
        new Date(),
        'weekly',
        '0.7'
      );
    });
    
    // Individual business pages
    businessesResult.rows.forEach(business => {
      const lastmod = business.updated_at || new Date();
      sitemap += generateUrlEntry(
        `${BASE_URL}/business/${business.id}`,
        lastmod,
        'monthly',
        '0.6'
      );
    });
    
    // Blog posts
    blogsResult.rows.forEach(blog => {
      const lastmod = blog.updated_at || new Date();
      sitemap += generateUrlEntry(
        `${BASE_URL}/blog/${blog.slug}`,
        lastmod,
        'monthly',
        '0.7'
      );
    });
    
    sitemap += '</urlset>';
    
    // Write to multiple locations (for different build outputs)
    const outputPaths = [
      path.join(__dirname, '../client/public/sitemap.xml'),
      path.join(__dirname, '../public/sitemap.xml'),
      path.join(__dirname, '../dist/public/sitemap.xml'),
    ];
    
    outputPaths.forEach(outputPath => {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, sitemap);
      console.log(`✅ Sitemap written to ${outputPath}`);
    });
    
    console.log('🎉 Sitemap generation complete!');
    console.log(`📊 Total URLs: ${businessesResult.rows.length + blogsResult.rows.length + staticPages.length + CATEGORIES.length + citiesResult.rows.length + 1}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function generateUrlEntry(loc, lastmod, changefreq, priority) {
  const lastmodStr = lastmod instanceof Date 
    ? lastmod.toISOString().split('T')[0]
    : new Date(lastmod).toISOString().split('T')[0];
  
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmodStr}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Run if called directly
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
