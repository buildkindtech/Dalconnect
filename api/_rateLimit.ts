import crypto from 'crypto';

/**
 * IP 기반 Rate Limiting (Vercel 서버리스 호환)
 * 
 * Vercel 서버리스는 인메모리 상태가 초기화되므로
 * Neon DB에 경량 테이블로 요청 횟수를 기록합니다.
 *
 * 사용법:
 *   const result = await checkRateLimit(req, 'newsletter', 5, 3600);
 *   if (!result.allowed) return res.status(429).json({ error: result.message });
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  message?: string;
}

// IP 해시 (개인정보 보호)
export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error('IP_HASH_SALT env var required');
  return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 32);
}

// 요청자 IP 추출
export function getClientIP(req: any): string {
  return (
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

/**
 * DB 기반 rate limit 체크
 * @param req         Vercel Request
 * @param action      구분 키 (예: 'newsletter', 'community_post', 'community_comment')
 * @param maxRequests 허용 횟수
 * @param windowSec   시간 윈도우 (초)
 */
export async function checkRateLimit(
  req: any,
  action: string,
  maxRequests: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    const ip = getClientIP(req);
    const ipHash = hashIP(ip);
    const pg = await import('pg');
    const pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    try {
      // 테이블 없으면 생성 (첫 실행 시)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          id SERIAL PRIMARY KEY,
          ip_hash VARCHAR(64) NOT NULL,
          action VARCHAR(64) NOT NULL,
          window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          request_count INT NOT NULL DEFAULT 1,
          UNIQUE(ip_hash, action, window_start)
        )
      `);

      const windowStart = new Date(Math.floor(Date.now() / (windowSec * 1000)) * (windowSec * 1000));

      // Upsert — 해당 윈도우의 요청 횟수 증가
      const result = await pool.query(`
        INSERT INTO rate_limits (ip_hash, action, window_start, request_count)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT (ip_hash, action, window_start)
        DO UPDATE SET request_count = rate_limits.request_count + 1
        RETURNING request_count
      `, [ipHash, action, windowStart]);

      const count = result.rows[0]?.request_count || 1;
      const remaining = Math.max(0, maxRequests - count);

      if (count > maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          message: `요청이 너무 많습니다. ${windowSec >= 3600 ? '1시간' : windowSec + '초'} 후에 다시 시도해주세요.`,
        };
      }

      return { allowed: true, remaining };
    } finally {
      await pool.end();
    }
  } catch (err) {
    // rate limit 체크 실패 시 허용 (서비스 중단 방지)
    console.error('Rate limit check failed:', err);
    return { allowed: true, remaining: 1 };
  }
}

/**
 * GET 요청 스크래핑 방어
 * Origin 없는 직접 API 호출(curl, 봇)은 차단
 * 단, 서버 크론잡 등 internal 요청은 허용
 */
export function isScrapingAttempt(req: any): boolean {
  const origin = req.headers?.origin || '';
  const referer = req.headers?.referer || '';
  const ua = req.headers?.['user-agent'] || '';

  // 허용된 도메인에서 오는 요청은 통과
  const allowedPatterns = [
    'dalkonnect.com', 'dalconnect.com', 'dalconnect.buildkind.tech',
    'dalconnect.vercel.app', 'localhost',
  ];
  if (allowedPatterns.some(p => origin.includes(p) || referer.includes(p))) return false;

  // Origin 없이 직접 API 호출하는 봇 UA 패턴
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python-requests/i, /go-http-client/i];
  if (!origin && botPatterns.some(p => p.test(ua))) return true;

  return false;
}
