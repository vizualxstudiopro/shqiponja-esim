/**
 * Analytics utility — GA4 + Meta Pixel
 *
 * GA4 uses Consent Mode v2: analytics_storage defaults to "denied" and is only
 * granted after the user accepts the cookie banner.
 *
 * Meta Pixel is NOT loaded at all until the user accepts; this avoids any
 * third-party script running without consent.
 */

const GA_ID = "G-LQ8N3VHELT";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

// ---------------------------------------------------------------------------
// Type augmentation
// ---------------------------------------------------------------------------
interface FbqFn {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: FbqFn;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq: FbqFn;
    _fbq: FbqFn;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isClient() {
  return typeof window !== "undefined";
}

function hasGtag(): boolean {
  return isClient() && typeof window.gtag === "function";
}

function hasFbq(): boolean {
  return isClient() && typeof window.fbq === "function";
}

// ---------------------------------------------------------------------------
// Consent management
// ---------------------------------------------------------------------------

/** Grant GA4 analytics consent and initialise Pixel (call on cookie accept). */
export function grantConsent(): void {
  if (!isClient()) return;
  if (hasGtag()) {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    });
    // Fire the page view we suppressed at config time
    window.gtag("event", "page_view");
  }
  if (PIXEL_ID) loadMetaPixel();
}

/** Revoke GA4 analytics consent (call on cookie decline). */
export function revokeConsent(): void {
  if (!isClient()) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
  if (hasGtag()) {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
  }
}

/**
 * Called once on client mount — checks localStorage for previously stored
 * consent and applies it so analytics work correctly across page loads.
 */
export function bootstrapFromStoredConsent(): void {
  if (!isClient()) return;
  try {
    const stored = localStorage.getItem("shqiponja-cookie-consent");
    if (stored === "accepted") grantConsent();
    else if (stored === "declined") revokeConsent();
  } catch {
    /* localStorage unavailable */
  }
}

// ---------------------------------------------------------------------------
// Meta Pixel loader (only runs after consent)
// ---------------------------------------------------------------------------
function loadMetaPixel(): void {
  if (!isClient() || !PIXEL_ID) return;

  // Already initialised in a previous consent-grant call
  if (hasFbq()) {
    window.fbq("track", "PageView");
    return;
  }

  // Build the fbq stub (mirrors the official Meta snippet)
  const fbq = function (...args: unknown[]) {
    if ((fbq as FbqFn).callMethod) {
      (fbq as FbqFn).callMethod!.apply(fbq, args as [string, ...unknown[]]);
    } else {
      (fbq as FbqFn).queue.push(args);
    }
  } as FbqFn;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  window.fbq = fbq;
  window._fbq = fbq;

  // Dynamically load fbevents.js
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

// ---------------------------------------------------------------------------
// Event tracking
// ---------------------------------------------------------------------------

export interface PurchaseParams {
  orderId: number;
  value: number;
  currency: string;
  packageName: string;
}

/** Fire a purchase event to GA4 and Meta Pixel. */
export function trackPurchase({ orderId, value, currency, packageName }: PurchaseParams): void {
  if (!isClient()) return;
  if (hasGtag()) {
    window.gtag("event", "purchase", {
      transaction_id: String(orderId),
      value,
      currency,
      items: [{ item_name: packageName, quantity: 1, price: value }],
    });
  }
  if (hasFbq()) {
    window.fbq("track", "Purchase", {
      value,
      currency,
      content_name: packageName,
      content_type: "product",
      content_ids: [String(orderId)],
    });
  }
}

export interface CheckoutParams {
  value: number;
  currency: string;
  packageName: string;
}

/** Fire a begin_checkout / InitiateCheckout event. */
export function trackBeginCheckout({ value, currency, packageName }: CheckoutParams): void {
  if (!isClient()) return;
  if (hasGtag()) {
    window.gtag("event", "begin_checkout", {
      value,
      currency,
      items: [{ item_name: packageName, quantity: 1, price: value }],
    });
  }
  if (hasFbq()) {
    window.fbq("track", "InitiateCheckout", {
      value,
      currency,
      content_name: packageName,
    });
  }
}
