import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://dalkonnect.com';
const DEFAULT_IMAGE = 'https://dalkonnect.com/opengraph.jpg';
const DEFAULT_DESC = '달라스 한인 업소록, 커뮤니티 뉴스, 사고팔기를 한곳에서. DFW 한인의 모든 것, DalKonnect.';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
  const urlPath = typeof rawPath === 'string' && rawPath.startsWith('/') ? rawPath : '/';
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  let title = 'DalKonnect - 달라스 한인 커뮤니티 포털';
  let desc = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;
  let url = DOMAIN + urlPath;
  let ogType = 'website';

  try {
    // /news/:id
    const newsMatch = urlPath.match(/^\/news\/([^/?#]+)$/);
    if (newsMatch) {
      const { rows } = await pool.query('SELECT title, content, thumbnail_url FROM news WHERE id=$1 LIMIT 1', [newsMatch[1]]);
      if (rows[0]) {
        ogType = 'article';
        title = `${rows[0].title} | DalKonnect`;
        desc = rows[0].content ? stripHtml(rows[0].content).slice(0, 160) : DEFAULT_DESC;
        image = rows[0].thumbnail_url || DEFAULT_IMAGE;
      }
    }

    // /business/:id
    const bizMatch = urlPath.match(/^\/business\/([^/?#]+)$/);
    if (bizMatch) {
      const { rows } = await pool.query('SELECT name_ko, name_en, description, cover_url, photos FROM businesses WHERE id=$1 LIMIT 1', [bizMatch[1]]);
      if (rows[0]) {
        ogType = 'profile';
        const name = rows[0].name_ko || rows[0].name_en;
        title = `${name} | DalKonnect 달라스 한인 업소록`;
        desc = rows[0].description ? String(rows[0].description).slice(0, 160) : `${name} - 달라스 한인 업소`;
        image = rows[0].cover_url || DEFAULT_IMAGE;
        if (image === DEFAULT_IMAGE) {
          try {
            const photos = typeof rows[0].photos === 'string' ? JSON.parse(rows[0].photos) : rows[0].photos;
            if (Array.isArray(photos) && photos.length > 0) image = photos[0];
          } catch {}
        }
      }
    }

    // /blog/:slug
    const blogMatch = urlPath.match(/^\/blog\/([^/?#]+)$/);
    if (blogMatch) {
      const { rows } = await pool.query('SELECT title, content, cover_url, cover_image FROM blogs WHERE slug=$1 LIMIT 1', [decodeURIComponent(blogMatch[1])]);
      if (rows[0]) {
        ogType = 'article';
        title = `${rows[0].title} | DalKonnect`;
        desc = rows[0].content ? stripHtml(rows[0].content).slice(0, 160) : DEFAULT_DESC;
        image = rows[0].cover_url || rows[0].cover_image || DEFAULT_IMAGE;
      }
    }
  } catch (e) {
    // fallback to defaults
  } finally {
    await pool.end().catch(() => {});
  }

  // Read index.html and inject meta tags
  const indexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch {
    try {
      const rootResponse = await fetch(`${DOMAIN}/`);
      if (rootResponse.ok) html = await rootResponse.text();
    } catch {}
  }

  if (!html) {
    return res.status(503).send('DalKonnect page renderer temporarily unavailable');
  }

  // Replace meta tags in index.html
  html = html.replace(/<title>[^<]*<\/title>/, `<title data-rh="true">${esc(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/, `<meta data-rh="true" name="description" content="${esc(desc)}">`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/, `<meta data-rh="true" property="og:title" content="${esc(title)}">`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/, `<meta data-rh="true" property="og:description" content="${esc(desc)}">`);
  html = html.replace(/<meta\s+property="og:image"[^>]*>/, `<meta data-rh="true" property="og:image" content="${esc(image)}">`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/, `<meta data-rh="true" property="og:url" content="${esc(url)}">`);
  html = html.replace(/<meta\s+property="og:type"[^>]*>/, `<meta data-rh="true" property="og:type" content="${ogType}">`);
  html = html.replace(/<meta\s+name="title"[^>]*>/, `<meta data-rh="true" name="title" content="${esc(title)}">`);
  html = html.replace(/<meta\s+property="twitter:url"[^>]*>/, `<meta data-rh="true" property="twitter:url" content="${esc(url)}">`);
  html = html.replace(/<meta\s+property="twitter:title"[^>]*>/, `<meta data-rh="true" property="twitter:title" content="${esc(title)}">`);
  html = html.replace(/<meta\s+property="twitter:description"[^>]*>/, `<meta data-rh="true" property="twitter:description" content="${esc(desc)}">`);
  html = html.replace(/<meta\s+property="twitter:image"[^>]*>/, `<meta data-rh="true" property="twitter:image" content="${esc(image)}">`);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/, `<link data-rh="true" rel="canonical" href="${esc(url)}">`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  res.setHeader('X-Robots-Tag', 'index, follow');
  res.status(200).send(html);
}
