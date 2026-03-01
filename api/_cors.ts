const ALLOWED_ORIGINS = [
  'https://dalconnect.vercel.app',
  'https://dalconnect.buildkind.tech',
  'https://www.dalconnect.com',
  'https://dalconnect.com',
  'http://localhost:5000',
  'http://localhost:5173',
];

export function setCorsHeaders(req: any, res: any) {
  const origin = (req.headers && req.headers.origin) || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleCorsPreflightOrSetHeaders(req: any, res: any): boolean {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
