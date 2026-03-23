import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://dalkonnect.com';
const DEFAULT_IMAGE = 'https://dalkonnect.com/og-image.png';
const DEFAULT_DESC = '달라스 한인 업소록, 커뮤니티 뉴스, 사고팔기를 한곳에서. DFW 한인의 모든 것, DalKonnect.';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const urlPath = req.query.path as string || '/';
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  let title = 'DalKonnect - 달라스 한인 커뮤니티 포털';
  let desc = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;
  let url = DOMAIN + urlPath;

  try {
    // /news/:id
    const newsMatch = urlPath.match(/^\/news\/([^/?#]+)$/);
    if (newsMatch) {
      const { rows } = await pool.query('SELECT title, content, thumbnail_url FROM news WHERE id=$1 LIMIT 1', [newsMatch[1]]);
      if (rows[0]) {
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
      const { rows } = await pool.query('SELECT title, content, thumbnail_url FROM blogs WHERE slug=$1 LIMIT 1', [blogMatch[1]]);
      if (rows[0]) {
        title = `${rows[0].title} | DalKonnect`;
        desc = rows[0].content ? stripHtml(rows[0].content).slice(0, 160) : DEFAULT_DESC;
        image = rows[0].thumbnail_url || DEFAULT_IMAGE;
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
    // fallback: generate minimal HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="article">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(url)}">
</head><body><p>${esc(desc)}</p><script>window.location.href="${esc(url)}";</script></body></html>`);
  }

  // Replace meta tags in index.html
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*"/, `$1${esc(desc)}"`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*"/, `$1${esc(title)}"`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*"/, `$1${esc(desc)}"`);
  html = html.replace(/(<meta\s+property="og:image"\s+content=")[^"]*"/, `$1${esc(image)}"`);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*"/, `$1${esc(url)}"`);
  html = html.replace(/(<meta\s+name="title"\s+content=")[^"]*"/, `$1${esc(title)}"`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(html);
}
