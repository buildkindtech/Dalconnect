import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function checkLimit(ip: string, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const storeKey = `${key}:${ip}`;
  const entry = store.get(storeKey);

  if (!entry || now >= entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  entry.count += 1;
  if (entry.count > limit) {
    return false; // exceeded
  }

  return true; // allowed
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

/**
 * General rate limit: 60 requests/min per IP
 */
export function generalRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const allowed = checkLimit(ip, "general", 60, 60 * 1000);

  if (!allowed) {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: 60,
    });
    return;
  }

  next();
}

/**
 * API rate limit: 30 requests/min per IP (stricter for /api/* endpoints)
 */
export function apiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const allowed = checkLimit(ip, "api", 30, 60 * 1000);

  if (!allowed) {
    res.status(429).json({
      error: "Too Many Requests",
      message: "API rate limit exceeded. Please try again in 1 minute.",
      retryAfter: 60,
    });
    return;
  }

  next();
}
