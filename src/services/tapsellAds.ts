import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Tapsell Mediation bridge (native Android plugin `TapsellAds`).
 *
 * On the web / preview build the plugin does not exist, so every call degrades gracefully and
 * the game keeps using its simulated ad flow.
 */

export type RewardedStatus = 'rewarded' | 'closed' | 'failed';

export interface RewardedResult {
  status: RewardedStatus;
  message?: string;
}

interface TapsellAdsBridge {
  initialize(): Promise<void>;
  showBanner(): Promise<{ visible: boolean; height?: number }>;
  hideBanner(): Promise<void>;
  showRewarded(): Promise<RewardedResult>;
}

const bridge = registerPlugin<TapsellAdsBridge>('TapsellAds');

export function isNativeAdsAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function setBannerHeight(height: number): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--ad-banner-h', `${Math.max(0, Math.round(height))}px`);
}

export async function initializeAds(): Promise<void> {
  if (!isNativeAdsAvailable()) return;
  try {
    await bridge.initialize();
  } catch {
    // Ads are optional; never block the game on initialization.
  }
}

export async function showBannerAd(): Promise<void> {
  if (!isNativeAdsAvailable()) return;
  try {
    const result = await bridge.showBanner();
    setBannerHeight(result.visible ? result.height ?? 50 : 0);
  } catch {
    setBannerHeight(0);
  }
}

export async function hideBannerAd(): Promise<void> {
  if (!isNativeAdsAvailable()) return;
  setBannerHeight(0);
  try {
    await bridge.hideBanner();
  } catch {
    // Ignore: the banner probably was not showing.
  }
}

export async function showRewardedAd(): Promise<RewardedResult> {
  if (!isNativeAdsAvailable()) return { status: 'failed', message: 'native-unavailable' };
  try {
    return await bridge.showRewarded();
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'rewarded-failed',
    };
  }
}
