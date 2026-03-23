/**
 * SEO helpers: Dynamic Sitemap + OG Meta Tag SSR injection
 * Used by server/routes.ts (sitemap) and server/vite.ts + server/static.ts (OG tags)
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const DOMAIN = "https://dalkonnect.com";
const DEFAULT_OG_IMAGE = "https://dalkonnect.com/og-image.png";
const DEFAULT_DESC =
  "달라스 한인 업소록, 커뮤니티 뉴스, 사고팔기를 한곳에서. DFW 한인의 모든 것, DalKonnect. 달사람들을 위한 달라스 한인 포털.";

export interface MetaTags {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Look at the URL path and return dynamic meta tags if applicable.
 * Returns null for pages that don't need dynamic meta (use index.html defaults).
 */
export async function getMetaTagsForUrl(urlPath: string): Promise<MetaTags | null> {
  try {
    // /news/:id
    const newsMatch = urlPath.match(/^\/news\/([^/?#]+)$/);
    if (newsMatch) {
      const id = newsMatch[1];
      const result = await db.execute(
        sql`SELECT title, content, thumbnail_url FROM news WHERE id = ${id} LIMIT 1`
      );
      const row = (result.rows?.[0] || (result as any)[0]) as any;
      if (!row) return null;
      const title = `${row.title} | DalKonnect 달라스 한인 뉴스`;
      const rawDesc = row.content ? stripHtml(String(row.content)).slice(0, 160) : DEFAULT_DESC;
      return {
        title,
        description: rawDesc,
        ogTitle: String(row.title),
        ogDescription: rawDesc,
        ogImage: row.thumbnail_url || DEFAULT_OG_IMAGE,
        ogUrl: `${DOMAIN}/news/${id}`,
      };
    }

    // /business/:id
    const bizMatch = urlPath.match(/^\/business\/([^/?#]+)$/);
    if (bizMatch) {
      const id = bizMatch[1];
      const result = await db.execute(
        sql`SELECT name_en, name_ko, description, cover_url, photos, category, city FROM businesses WHERE id = ${id} LIMIT 1`
      );
      const row = (result.rows?.[0] || (result as any)[0]) as any;
      if (!row) return null;
      const name = row.name_ko || row.name_en;
      const title = `${name} | DalKonnect 달라스 한인 업소록`;
      const desc = row.description
        ? String(row.description).slice(0, 160)
        : `${name} - 달라스 한인 업소 정보`;
      // photos is JSON array; try first photo or cover_url
      let image = row.cover_url || DEFAULT_OG_IMAGE;
      if (!image || image === DEFAULT_OG_IMAGE) {
        try {
          const photos = typeof row.photos === "string" ? JSON.parse(row.photos) : row.photos;
          if (Array.isArray(photos) && photos.length > 0) image = photos[0];
        } catch {}
      }
      return {
        title,
        description: desc,
        ogTitle: name,
        ogDescription: desc,
        ogImage: image,
        ogUrl: `${DOMAIN}/business/${id}`,
      };
    }

    // /blog/:slug
    const blogMatch = urlPath.match(/^\/blog\/([^/?#]+)$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const result = await db.execute(
        sql`SELECT title, content, thumbnail_url, cover_url, cover_image, excerpt FROM blogs WHERE slug = ${slug} LIMIT 1`
      );
      const row = (result.rows?.[0] || (result as any)[0]) as any;
      if (!row) return null;
      const title = `${row.title} | DalKonnect 블로그`;
      const rawDesc = row.excerpt
        ? String(row.excerpt).slice(0, 160)
        : row.content
        ? stripHtml(String(row.content)).slice(0, 160)
        : DEFAULT_DESC;
      const image = row.thumbnail_url || row.cover_url || row.cover_image || DEFAULT_OG_IMAGE;
      return {
        title,
        description: rawDesc,
        ogTitle: String(row.title),
        ogDescription: rawDesc,
        ogImage: image,
        ogUrl: `${DOMAIN}/blog/${slug}`,
      };
    }
  } catch (err) {
    console.error("[SEO] getMetaTagsForUrl error:", err);
  }

  return null;
}

/**
 * Replace meta tag placeholders in the index.html string with dynamic values.
 */
export function injectMetaTags(html: string, meta: MetaTags): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const ot = escapeHtml(meta.ogTitle);
  const od = escapeHtml(meta.ogDescription);
  const oi = escapeHtml(meta.ogImage);
  const ou = escapeHtml(meta.ogUrl);

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);

  // description
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${d}" />`
  );
  html = html.replace(
    /<meta name="title"[^>]*>/,
    `<meta name="title" content="${t}" />`
  );

  // OG tags
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${ot}" />`
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${od}" />`
  );
  html = html.replace(
    /<meta property="og:image"[^>]*>/,
    `<meta property="og:image" content="${oi}" />`
  );
  html = html.replace(
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${ou}" />`
  );

  // Twitter tags (property or name variants)
  html = html.replace(
    /<meta property="twitter:title"[^>]*>/,
    `<meta property="twitter:title" content="${ot}" />`
  );
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${ot}" />`
  );
  html = html.replace(
    /<meta property="twitter:description"[^>]*>/,
    `<meta property="twitter:description" content="${od}" />`
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${od}" />`
  );
  html = html.replace(
    /<meta property="twitter:image"[^>]*>/,
    `<meta property="twitter:image" content="${oi}" />`
  );
  html = html.replace(
    /<meta name="twitter:image"[^>]*>/,
    `<meta name="twitter:image" content="${oi}" />`
  );
  html = html.replace(
    /<meta property="twitter:url"[^>]*>/,
    `<meta property="twitter:url" content="${ou}" />`
  );
  html = html.replace(
    /<meta name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${ou}" />`
  );

  // Ensure twitter:card exists
  if (!html.includes("twitter:card")) {
    html = html.replace(
      "</head>",
      `  <meta name="twitter:card" content="summary_large_image" />\n  </head>`
    );
  }

  return html;
}

/**
 * Generate full dynamic sitemap XML from DB.
 */
export async function generateSitemapXml(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/news", changefreq: "hourly", priority: "0.9" },
    { path: "/businesses", changefreq: "weekly", priority: "0.9" },
    { path: "/community", changefreq: "daily", priority: "0.8" },
    { path: "/marketplace", changefreq: "daily", priority: "0.7" },
    { path: "/charts", changefreq: "weekly", priority: "0.7" },
    { path: "/blog", changefreq: "daily", priority: "0.7" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
  ];

  // Fetch all IDs from DB concurrently
  const [bizRes, newsRes, blogRes, comRes] = await Promise.all([
    db.execute(
      sql`SELECT id, updated_at, created_at FROM businesses ORDER BY created_at DESC`
    ),
    db.execute(
      sql`SELECT id, created_at FROM news ORDER BY created_at DESC`
    ),
    db.execute(
      sql`SELECT slug, updated_at, created_at FROM blogs ORDER BY created_at DESC`
    ),
    db.execute(
      sql`SELECT id, updated_at, created_at FROM community_posts ORDER BY created_at DESC`
    ),
  ]);

  const toDate = (row: any, col1: string, col2 = "created_at"): string => {
    const val = row[col1] || row[col2];
    if (!val) return today;
    try {
      return new Date(val).toISOString().split("T")[0];
    } catch {
      return today;
    }
  };

  const urls: string[] = [];

  // Static
  for (const p of staticPages) {
    urls.push(
      `  <url>\n    <loc>${DOMAIN}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    );
  }

  const bizRows = (bizRes.rows || bizRes) as any[];
  const newsRows = (newsRes.rows || newsRes) as any[];
  const blogRows = (blogRes.rows || blogRes) as any[];
  const comRows = (comRes.rows || comRes) as any[];

  for (const row of bizRows) {
    urls.push(
      `  <url>\n    <loc>${DOMAIN}/business/${row.id}</loc>\n    <lastmod>${toDate(row, "updated_at")}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  }

  for (const row of newsRows) {
    urls.push(
      `  <url>\n    <loc>${DOMAIN}/news/${row.id}</loc>\n    <lastmod>${toDate(row, "created_at")}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    );
  }

  for (const row of blogRows) {
    urls.push(
      `  <url>\n    <loc>${DOMAIN}/blog/${row.slug}</loc>\n    <lastmod>${toDate(row, "updated_at")}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );
  }

  for (const row of comRows) {
    urls.push(
      `  <url>\n    <loc>${DOMAIN}/community/${row.id}</loc>\n    <lastmod>${toDate(row, "updated_at")}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
