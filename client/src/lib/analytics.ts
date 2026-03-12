/**
 * Analytics utilities for DalConnect
 * Supports GA4 and Umami (both optional, controlled by env vars)
 */

// ---------- GA4 ----------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;

/** Track a GA4 pageview (call on route change) */
export function trackPageview(path: string, title?: string) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('config', GA4_ID, {
    page_path: path,
    page_title: title,
  });
}

/** Track a custom GA4 event */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}

// ---------- Umami ----------

/** Track a custom Umami event (pageviews are automatic) */
export function trackUmamiEvent(eventName: string, data?: Record<string, string | number>) {
  // Umami auto-injects window.umami when the script loads
  const umami = (window as unknown as { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }).umami;
  if (!umami) return;
  umami.track(eventName, data);
}
