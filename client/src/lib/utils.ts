import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * fetch with automatic retry + exponential backoff.
 * Neon 콜드스타트 시 /api/* 가 랜덤하게 500을 내는 문제 대응.
 * !res.ok 또는 network error 시 재시도. 마지막 실패 시 throw.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 3, baseDelayMs = 400 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetch failed');
}

/**
 * "$190" / "$1,234.50" 같은 문자열에서 첫 유효 숫자 하나만 추출.
 * "$190$80" 처럼 숫자가 2개 이상 붙어 있으면 파싱 실패(null)로 취급.
 */
function parseSinglePrice(raw: unknown): number | null {
  if (typeof raw === 'number') return isFinite(raw) && raw > 0 ? raw : null;
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  // "-62%", "Limited time" 같은 오염 텍스트가 섞이면 거부
  if (/%/.test(s) || /[a-zA-Z]/.test(s)) return null;
  // $ 와 콤마, 숫자만 허용. 숫자 그룹이 정확히 1개일 때만 유효.
  const matches = s.match(/\$?\s*\d[\d,]*(?:\.\d+)?/g);
  if (!matches || matches.length !== 1) return null;
  const num = parseFloat(matches[0].replace(/[$,\s]/g, ''));
  return isFinite(num) && num > 0 ? num : null;
}

export interface RawDeal {
  id: string | number;
  original_price?: unknown;
  deal_price?: unknown;
  discount?: unknown;
  image_url?: string | null;
  [k: string]: unknown;
}

/**
 * 스크레이퍼 파싱 버그로 오염된 딜을 홈 렌더링 직전에 걸러낸다.
 * - original_price / deal_price 가 단일 숫자로 파싱 안 되면 제외 ("$190$80" 등)
 * - 계산된 할인율이 5%~90% 범위를 벗어나면 제외 ("100% OFF" 등)
 * - 여러 딜이 동일한 image_url(placeholder)을 공유하면 그 중복 딜 전체 제외
 * DB row 는 건드리지 않고 프론트 필터로만 처리.
 */
export function filterValidDeals<T extends RawDeal>(deals: T[]): T[] {
  if (!Array.isArray(deals)) return [];

  // 중복 이미지 URL 집계 (2건 이상이면 placeholder로 간주)
  const imgCount = new Map<string, number>();
  for (const d of deals) {
    const url = (d.image_url || '').split('?')[0];
    if (url) imgCount.set(url, (imgCount.get(url) ?? 0) + 1);
  }

  return deals.filter((d) => {
    const orig = parseSinglePrice(d.original_price);
    const price = parseSinglePrice(d.deal_price);
    if (orig === null || price === null) return false;
    if (price >= orig) return false; // 할인 아님
    const pct = Math.round(((orig - price) / orig) * 100);
    if (pct < 5 || pct > 90) return false; // 100% off 등 명백한 오류 방지

    const url = (d.image_url || '').split('?')[0];
    if (url && (imgCount.get(url) ?? 0) > 1) return false; // 중복 placeholder 이미지

    return true;
  });
}
