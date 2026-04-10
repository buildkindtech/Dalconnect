import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const DOMAIN = 'https://dalkonnect.com';

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');

  const { type } = req.query;
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const now = new Date().toISOString().split('T')[0];

    // Sitemap Index (default)
    if (!type) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml?type=static</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml?type=businesses</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml?type=news</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml?type=blogs</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml?type=community</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
      return res.status(200).send(xml);
    }

    const urls: string[] = [];

    if (type === 'static') {
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
      for (const p of staticPages) {
        urls.push(urlEntry(`${DOMAIN}${p.url}`, now, p.changefreq, p.priority));
      }
    }

    if (type === 'businesses') {
      const { rows } = await pool.query(
        "SELECT id, updated_at FROM businesses ORDER BY updated_at DESC NULLS LAST"
      ).catch(() => ({ rows: [] as any[] }));
      for (const row of rows) {
        const d = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : now;
        urls.push(urlEntry(`${DOMAIN}/business/${row.id}`, d, 'monthly', '0.7'));
      }
    }

    if (type === 'news') {
      const { rows } = await pool.query(
        "SELECT id, published_date FROM news WHERE content IS NOT NULL AND LENGTH(content) > 50 ORDER BY published_date DESC LIMIT 10000"
      ).catch(() => ({ rows: [] as any[] }));
      for (const row of rows) {
        const d = row.published_date ? new Date(row.published_date).toISOString().split('T')[0] : now;
        urls.push(urlEntry(`${DOMAIN}/news/${row.id}`, d, 'monthly', '0.6'));
      }
    }

    if (type === 'blogs') {
      const { rows } = await pool.query(
        "SELECT slug, created_at FROM blogs WHERE slug IS NOT NULL ORDER BY created_at DESC"
      ).catch(() => ({ rows: [] as any[] }));
      for (const row of rows) {
        const d = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : now;
        urls.push(urlEntry(`${DOMAIN}/blog/${row.slug}`, d, 'monthly', '0.7'));
      }
    }

    if (type === 'community') {
      const { rows } = await pool.query(
        "SELECT id, created_at FROM community_posts ORDER BY created_at DESC"
      ).catch(() => ({ rows: [] as any[] }));
      for (const row of rows) {
        const d = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : now;
        urls.push(urlEntry(`${DOMAIN}/community/${row.id}`, d, 'monthly', '0.5'));
      }
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
