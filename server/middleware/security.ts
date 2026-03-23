import { Request, Response, NextFunction } from "express";

interface TrafficEntry {
  timestamps: number[]; // sliding window of request timestamps
}

interface BlockEntry {
  blockedUntil: number;
}

const trafficStore = new Map<string, TrafficEntry>();
const blockedIPs = new Map<string, BlockEntry>();

const SUSPICIOUS_THRESHOLD = 50;      // requests in 10 seconds → log "suspicious"
const SUSPICIOUS_WINDOW_MS = 10_000;  // 10 seconds
const BLOCK_THRESHOLD = 200;          // requests in 1 minute → block
const BLOCK_WINDOW_MS = 60_000;       // 1 minute
const BLOCK_DURATION_MS = 10 * 60_000; // 10 minutes

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function formatTime(ts: number): string {
  return new Date(ts).toISOString();
}

// Clean up old entries every 2 minutes
setInterval(() => {
  const now = Date.now();

  trafficStore.forEach((entry, ip) => {
    const cutoff = now - BLOCK_WINDOW_MS;
    entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);
    if (entry.timestamps.length === 0) {
      trafficStore.delete(ip);
    }
  });

  blockedIPs.forEach((block, ip) => {
    if (now >= block.blockedUntil) {
      blockedIPs.delete(ip);
    }
  });
}, 2 * 60_000);

/**
 * Security middleware:
 * - Blocks known bad IPs
 * - Detects suspicious traffic bursts
 * - Auto-blocks IPs exceeding 200 req/min
 * - Sets security response headers
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();

  // --- Security Headers ---
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // --- Check if IP is blocked ---
  const block = blockedIPs.get(ip);
  if (block) {
    if (now < block.blockedUntil) {
      const retryAfterSec = Math.ceil((block.blockedUntil - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: "Too Many Requests",
        message: "Your IP has been temporarily blocked due to excessive requests.",
        retryAfter: retryAfterSec,
      });
      return;
    } else {
      // Block expired
      blockedIPs.delete(ip);
    }
  }

  // --- Track traffic ---
  let entry = trafficStore.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    trafficStore.set(ip, entry);
  }

  entry.timestamps.push(now);

  // Sliding window: keep only the last 1 minute of timestamps
  const windowCutoff = now - BLOCK_WINDOW_MS;
  entry.timestamps = entry.timestamps.filter((t) => t > windowCutoff);

  const countLastMinute = entry.timestamps.length;
  const countLast10Sec = entry.timestamps.filter((t: number) => t > now - SUSPICIOUS_WINDOW_MS).length;

  // --- Auto-block: 200+ requests in 1 minute ---
  if (countLastMinute >= BLOCK_THRESHOLD) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    blockedIPs.set(ip, { blockedUntil });
    console.warn(
      `[security] BLOCKED IP ${ip} — ${countLastMinute} req/min exceeded threshold of ${BLOCK_THRESHOLD}. Blocked until ${formatTime(blockedUntil)}`
    );
    res.setHeader("Retry-After", String(BLOCK_DURATION_MS / 1000));
    res.status(429).json({
      error: "Too Many Requests",
      message: "Your IP has been temporarily blocked due to excessive requests.",
      retryAfter: BLOCK_DURATION_MS / 1000,
    });
    return;
  }

  // --- Suspicious: 50+ requests in 10 seconds ---
  if (countLast10Sec >= SUSPICIOUS_THRESHOLD) {
    console.warn(
      `[security] SUSPICIOUS traffic from IP ${ip} — ${countLast10Sec} requests in 10 seconds`
    );
  }

  next();
}
