import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Cafe Bazaar In-App Billing (پرداخت درون‌برنامه‌ای کافه‌بازار) bridge.
 *
 * On Android the native Poolakey plugin (`BazaarIAB`) verifies every purchase signature against
 * the developer RSA public key, so a `success: true` result always means a genuine, verified
 * purchase. On Web / preview there is no native binding, so the interactive sandbox checkout modal
 * is used for testing.
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

interface BazaarIABPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  launchPurchaseFlow(options: { sku: string; developerPayload: string }): Promise<{
    success: boolean;
    purchaseToken?: string;
    orderId?: string;
    cancelled?: boolean;
    errorMessage?: string;
  }>;
}

const nativePlugin = registerPlugin<BazaarIABPlugin>('BazaarIAB');

declare global {
  interface Window {
    BazaarIAB?: NativeBazaarBridge;
  }
}

export function isNativeBazaarAvailable(): boolean {
  // On the native app we use the Poolakey plugin; in the browser the fallback is the sandbox.
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return true;
  }
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
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      return await nativePlugin.launchPurchaseFlow({ sku, developerPayload });
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'خطا در پرداخت کافه‌بازار',
      };
    }
  }
  if (window.BazaarIAB) {
    return window.BazaarIAB.launchPurchaseFlow(sku, developerPayload);
  }
  return { success: false, errorMessage: 'درگاه کافه‌بازار در محیط وب به‌صورت آزمایشی فعال است.' };
}
