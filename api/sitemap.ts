import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const DOMAIN = 'https://dalkonnect.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const now = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/businesses', priority: '0.9', changefreq: 'weekly' },
      { url: '/news', priority: '0.9', changefreq: 'hourly' },
      { url: '/blog', priority: '0.8', changefreq: 'daily' },
      { url: '/marketplace', priority: '0.7', changefreq: 'daily' },
      { url: '/community', priority: '0.7', changefreq: 'daily' },
      { url: '/deals', priority: '0.7', changefreq: 'daily' },
      { url: '/charts', priority: '0.6', changefreq: 'weekly' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
    ];

    // Dynamic content
    const [businesses, news, blogs, community] = await Promise.all([
      pool.query("SELECT id, updated_at FROM businesses ORDER BY updated_at DESC NULLS LAST").catch(() => ({ rows: [] })),
      pool.query("SELECT id, published_date FROM news WHERE content IS NOT NULL AND LENGTH(content) > 50 ORDER BY published_date DESC").catch(() => ({ rows: [] })),
      pool.query("SELECT slug, created_at FROM blogs WHERE slug IS NOT NULL ORDER BY created_at DESC").catch(() => ({ rows: [] })),
      pool.query("SELECT id, created_at FROM community_posts ORDER BY created_at DESC").catch(() => ({ rows: [] })),
    ]);

    const urls: string[] = [];

    // Static
    for (const p of staticPages) {
      urls.push(`  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
    }

    // Businesses
    for (const row of businesses.rows) {
      const d = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : now;
      urls.push(`  <url>
    <loc>${DOMAIN}/business/${row.id}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // News
    for (const row of news.rows) {
      const d = row.published_date ? new Date(row.published_date).toISOString().split('T')[0] : now;
      urls.push(`  <url>
    <loc>${DOMAIN}/news/${row.id}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    // Blogs
    for (const row of blogs.rows) {
      const d = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : now;
      urls.push(`  <url>
    <loc>${DOMAIN}/blog/${row.slug}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // Community
    for (const row of community.rows) {
      const d = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : now;
      urls.push(`  <url>
    <loc>${DOMAIN}/community/${row.id}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Sitemap error:', err?.message);
    res.status(500).send('<?xml version="1.0"?><error>Sitemap generation failed</error>');
  } finally {
    await pool.end().catch(() => {});
  }
}
