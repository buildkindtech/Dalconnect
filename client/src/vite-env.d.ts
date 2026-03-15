/// <reference types="vite/client" />

// GA4 global
interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}
