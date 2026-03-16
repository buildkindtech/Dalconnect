import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const ALLOWED = ['https://dalkonnect.com','https://www.dalkonnect.com','https://dalconnect.buildkind.tech','http://localhost:5000','http://localhost:5173'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { name, email, type, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, type, message, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [name, email, type || '일반 문의', message]
    );

    // SendGrid notification
    if (process.env.SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: 'info@dalkonnect.com' }] }],
          from: { email: 'info@dalkonnect.com', name: 'DalKonnect' },
          reply_to: { email, name },
          subject: `[DalKonnect 문의] ${type || '일반 문의'} - ${name}`,
          content: [{ type: 'text/html', value: `<h2>새 문의</h2><p><b>이름:</b> ${name}</p><p><b>이메일:</b> ${email}</p><p><b>유형:</b> ${type || '일반 문의'}</p><p><b>메시지:</b> ${message}</p>` }],
        }),
      });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('contact error:', err?.message);
    return res.status(500).json({ error: 'Failed to send message' });
  } finally { await pool.end().catch(() => {}); }
}
