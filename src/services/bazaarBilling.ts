/**
 * Cafe Bazaar In-App Billing (پرداخت درون‌برنامه‌ای کافه‌بازار) bridge.
 *
 * On Android (via WebView / Poolakey JS bridge):
 *   If `window.BazaarIAB` is injected by the Android host wrapper, purchases call
 *   the real Cafe Bazaar Poolakey SDK and resolve with a signed purchase token.
 *
 * On Web Preview / Browser:
 *   Falls back cleanly to the interactive Cafe Bazaar Sandbox Checkout Modal so
 *   players can test the full purchase & currency-grant flow safely.
 */

export interface NativeBazaarBridge {
  isReady?: () => boolean;
  launchPurchaseFlow: (sku: string, developerPayload: string) => Promise<{
    success: boolean;
    purchaseToken?: string;
    orderId?: string;
    cancelled?: boolean;
    errorMessage?: string;
  }>;
}

declare global {
  interface Window {
    BazaarIAB?: NativeBazaarBridge;
  }
}

export function isNativeBazaarAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = window.BazaarIAB;
  if (!bridge || typeof bridge.launchPurchaseFlow !== 'function') return false;
  return bridge.isReady ? bridge.isReady() : true;
}

export async function launchNativeBazaarPurchase(
  sku: string,
  developerPayload: string
): Promise<{
  success: boolean;
  purchaseToken?: string;
  orderId?: string;
  cancelled?: boolean;
  errorMessage?: string;
}> {
  if (!window.BazaarIAB) {
    return { success: false, errorMessage: 'درگاه کافه‌بازار در محیط وب به‌صورت آزمایشی فعال است.' };
  }
  return window.BazaarIAB.launchPurchaseFlow(sku, developerPayload);
}
