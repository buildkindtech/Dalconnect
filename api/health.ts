import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      status: "setup_required",
      message: "DATABASE_URL environment variable not configured",
      instructions: "Add DATABASE_URL to Vercel Environment Variables"
    });
  }

  return res.status(200).json({ status: "ok" });
}
