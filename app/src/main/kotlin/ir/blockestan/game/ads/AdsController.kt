package ir.blockestan.game.ads

import android.app.Activity
import android.util.Log
import ir.blockestan.game.BuildConfig
import ir.tapsell.mediation.Tapsell

/**
 * Chooses ad providers from build configuration.
 *
 * - Debug builds use a clearly labelled simulated rewarded provider (no revenue, never in release).
 * - Release builds use Tapsell only when the App ID and zone ids are configured.
 * - With blank configuration the app runs normally, and ad buttons explain that ads are not
 *   configured. No reward is ever fabricated in a release build.
 */
class AdsController {
    val rewarded: RewardedAds
    val interstitial: InterstitialAds
    private val isRelease: Boolean

    init {
        val release = !BuildConfig.DEBUG
        isRelease = release
        if (release) {
            rewarded = if (BuildConfig.ADS_CONFIGURED) {
                TapsellRewardedAds(BuildConfig.TAPSELL_REWARDED_ZONE_ID)
            } else {
                UnavailableRewardedAds
            }
            interstitial = if (BuildConfig.ADS_CONFIGURED &&
                BuildConfig.TAPSELL_INTERSTITIAL_ZONE_ID.isNotBlank()
            ) {
                TapsellInterstitialAds(BuildConfig.TAPSELL_INTERSTITIAL_ZONE_ID)
            } else {
                NoInterstitialAds
            }
        } else {
            rewarded = SimulatedRewardedAds()
            interstitial = NoInterstitialAds
        }
    }

    fun preload() {
        rewarded.preload()
        interstitial.preload()
    }

    /** Called from the Activity once the Tapsell SDK reports initialization. */
    fun applyConsent(activity: Activity, personalized: Boolean) {
        if (isRelease && BuildConfig.ADS_CONFIGURED) {
            runCatching { Tapsell.setUserConsent(activity, personalized) }
                .onFailure { Log.w("BlockestanAds", "consent failed", it) }
        }
    }

    fun registerInitializationListener(activityProvider: () -> Activity?, consent: () -> Boolean) {
        if (!isRelease || !BuildConfig.ADS_CONFIGURED) return
        runCatching {
            Tapsell.setInitializationListener {
                val activity = activityProvider() ?: return@setInitializationListener
                applyConsent(activity, consent())
                preload()
            }
        }.onFailure { Log.w("BlockestanAds", "init listener failed", it) }
    }

    fun statusLabel(): String = when {
        rewarded.simulated -> "تبلیغ شبیه‌سازی‌شده (فقط در نسخهٔ آزمایشی، بدون درآمد)"
        rewarded.configured -> "تبلیغ جایزه‌دار واقعی (تپسل)"
        else -> "تبلیغ جایزه‌دار پیکربندی نشده است"
    }
}
