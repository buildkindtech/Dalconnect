import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const ALLOWED = ['https://dalkonnect.com','https://www.dalkonnect.com','https://dalconnect.buildkind.tech','http://localhost:5000','http://localhost:5173'];

const SERVICE_LABELS: Record<string, string> = {
  hvac: '에어컨/냉난방',
  electrical: '전기',
  plumbing: '배관/수도',
  cleaning: '청소',
  moving: '이사',
  handyman: '핸디맨',
  computer: '컴퓨터/IT',
  pest: '해충방제',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { service_type, name, phone, email, zip, message } = req.body || {};
  if (!service_type || !name || !phone) {
    return res.status(400).json({ error: '서비스 종류, 이름, 전화번호를 입력해주세요.' });
  }

  const serviceLabel = SERVICE_LABELS[service_type] || service_type;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });

  try {
    await pool.query(
      `INSERT INTO contact_messages (name, email, type, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        name,
        email || '',
        `홈서비스 - ${serviceLabel}`,
        `전화: ${phone}\n우편번호: ${zip || '미입력'}\n상세 내용: ${message || '없음'}`,
      ]
    );

    // SendGrid 알림
    if (process.env.SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: 'info@buildkind.tech' }] }],
          from: { email: 'info@dalkonnect.com', name: 'DalKonnect 홈서비스' },
          reply_to: { email: email || 'noreply@dalkonnect.com', name },
          subject: `[홈서비스 신청] ${serviceLabel} — ${name} (${phone})`,
          content: [{
            type: 'text/html',
            value: `
              <h2>새 홈서비스 신청</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:8px;font-weight:bold">서비스</td><td style="padding:8px">${serviceLabel}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">이름</td><td style="padding:8px">${name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">전화</td><td style="padding:8px">${phone}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">이메일</td><td style="padding:8px">${email || '없음'}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">우편번호</td><td style="padding:8px">${zip || '없음'}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">상세 내용</td><td style="padding:8px">${message || '없음'}</td></tr>
              </table>
            `,
          }],
        }),
      });
    }

    // Telegram 알림
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const chatId = '-5280678324';
      const text = `🔧 홈서비스 신청\n서비스: ${serviceLabel}\n이름: ${name}\n전화: ${phone}\n우편번호: ${zip || '-'}\n내용: ${message || '-'}`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('services error:', err?.message);
    return res.status(500).json({ error: '신청 처리 중 오류가 발생했습니다.' });
  } finally {
    await pool.end().catch(() => {});
  }
}
