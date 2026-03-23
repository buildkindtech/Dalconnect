// Vercel Edge Middleware — bot detection → OG meta tag API
const BOT_RE = /googlebot|bingbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot|applebot|yandex|kakaotalk|line|pinterest|slackbot/i;

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only intercept dynamic content pages for bots
  const isDynamic = /^\/(news|business|blog)\/[^/]+/.test(path);
  
  if (isDynamic && BOT_RE.test(ua)) {
    // Rewrite to OG API
    const ogUrl = new URL(`/api/og?path=${encodeURIComponent(path)}`, request.url);
    return Response.redirect(ogUrl, 307);
  }
}

export const config = {
  matcher: ['/news/:path*', '/business/:path*', '/blog/:path*'],
};
