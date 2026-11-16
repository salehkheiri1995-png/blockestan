import { GameBalanceConfig } from './balance';

export class InterstitialPolicy {
  private readonly firstRunsWithoutAds = GameBalanceConfig.INTERSTITIAL_FIRST_RUNS_WITHOUT_ADS;
  private readonly everyNRuns = GameBalanceConfig.INTERSTITIAL_EVERY_N_RUNS;
  private readonly minIntervalSeconds = GameBalanceConfig.INTERSTITIAL_MIN_INTERVAL_SECONDS;
  private readonly afterRewardedSeconds = GameBalanceConfig.INTERSTITIAL_AFTER_REWARDED_COOLDOWN_SECONDS;

  shouldShow(
    runsFinished: number,
    nowMs: number,
    lastInterstitialAtMs: number | null,
    lastRewardedAtMs: number | null
  ): boolean {
    if (runsFinished <= this.firstRunsWithoutAds) return false;
    if ((runsFinished - 1) % this.everyNRuns !== 0) return false;
    if (lastInterstitialAtMs !== null && lastInterstitialAtMs > 0) {
      if (nowMs - lastInterstitialAtMs < this.minIntervalSeconds * 1000) return false;
    }
    if (lastRewardedAtMs !== null && lastRewardedAtMs > 0) {
      if (nowMs - lastRewardedAtMs < this.afterRewardedSeconds * 1000) return false;
    }
    return true;
  }
}
