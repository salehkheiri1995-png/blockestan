package ir.blockestan.game.ads

import ir.blockestan.game.core.engine.GameBalanceConfig

/**
 * Pure ad-frequency policy, unit-tested on the JVM. The policy only decides whether an
 * interstitial may be shown at a natural stop; it never forces one.
 *
 * Rules:
 *  - the first [firstRunsWithoutAds] completed runs never show an interstitial;
 *  - afterwards at most one interstitial every [everyNRuns] completed runs;
 *  - at least [minIntervalSeconds] seconds between interstitials;
 *  - no interstitial within [afterRewardedSeconds] of a rewarded reward.
 */
class InterstitialPolicy(
    private val firstRunsWithoutAds: Int = GameBalanceConfig.INTERSTITIAL_FIRST_RUNS_WITHOUT_ADS,
    private val everyNRuns: Int = GameBalanceConfig.INTERSTITIAL_EVERY_N_RUNS,
    private val minIntervalSeconds: Long = GameBalanceConfig.INTERSTITIAL_MIN_INTERVAL_SECONDS,
    private val afterRewardedSeconds: Long =
        GameBalanceConfig.INTERSTITIAL_AFTER_REWARDED_COOLDOWN_SECONDS
) {
    fun shouldShow(
        runsFinished: Int,
        nowMs: Long,
        lastInterstitialAtMs: Long?,
        lastRewardedAtMs: Long?
    ): Boolean {
        if (runsFinished <= firstRunsWithoutAds) return false
        if ((runsFinished - 1) % everyNRuns != 0) return false
        if (lastInterstitialAtMs != null && lastInterstitialAtMs > 0) {
            if (nowMs - lastInterstitialAtMs < minIntervalSeconds * 1000L) return false
        }
        if (lastRewardedAtMs != null && lastRewardedAtMs > 0) {
            if (nowMs - lastRewardedAtMs < afterRewardedSeconds * 1000L) return false
        }
        return true
    }
}
