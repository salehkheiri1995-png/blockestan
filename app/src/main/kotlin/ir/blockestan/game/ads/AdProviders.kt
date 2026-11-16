package ir.blockestan.game.ads

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import ir.tapsell.mediation.Tapsell
import ir.tapsell.mediation.ad.AdStateListener
import ir.tapsell.mediation.ad.request.RequestResultListener
import ir.tapsell.mediation.ad.show.AdShowCompletionState

sealed interface RewardedAdEvent {
    data object Shown : RewardedAdEvent
    data object Reward : RewardedAdEvent
    data object Closed : RewardedAdEvent
    data class Failed(val message: String) : RewardedAdEvent
}

interface RewardedAds {
    /** True only for the debug fake provider. Release builds always report false. */
    val simulated: Boolean
    val configured: Boolean
    /** Loads an ad proactively. Safe to call repeatedly. */
    fun preload()
    /** Shows a previously loaded ad. Events arrive on the main thread. */
    fun show(activity: Activity, onEvent: (RewardedAdEvent) -> Unit)
}

interface InterstitialAds {
    val simulated: Boolean
    val configured: Boolean
    fun preload()
    /** Returns false when no ad is ready, so the caller can navigate immediately. */
    fun show(activity: Activity, onClosed: (Boolean) -> Unit): Boolean
}

object UnavailableRewardedAds : RewardedAds {
    override val simulated = false
    override val configured = false
    override fun preload() = Unit
    override fun show(activity: Activity, onEvent: (RewardedAdEvent) -> Unit) {
        onEvent(RewardedAdEvent.Failed("تبلیغ جایزه‌دار در این نسخه پیکربندی نشده است."))
    }
}

object NoInterstitialAds : InterstitialAds {
    override val simulated = false
    override val configured = false
    override fun preload() = Unit
    override fun show(activity: Activity, onClosed: (Boolean) -> Unit): Boolean = false
}

/**
 * Debug-only fake. It is selected exclusively behind [BuildConfig.DEBUG], is clearly labelled
 * in the UI, produces no revenue, and is never reachable from a release build.
 */
class SimulatedRewardedAds : RewardedAds {
    override val simulated = true
    override val configured = true
    private val handler = Handler(Looper.getMainLooper())

    override fun preload() = Unit

    override fun show(activity: Activity, onEvent: (RewardedAdEvent) -> Unit) {
        onEvent(RewardedAdEvent.Shown)
        handler.postDelayed({ onEvent(RewardedAdEvent.Reward) }, 1600L)
        handler.postDelayed({ onEvent(RewardedAdEvent.Closed) }, 1900L)
    }
}

class TapsellRewardedAds(private val zoneId: String) : RewardedAds {
    override val simulated = false
    override val configured: Boolean = zoneId.isNotBlank()

    @Volatile
    private var adId: String? = null

    @Volatile
    private var loading = false

    override fun preload() {
        if (!configured || loading || adId != null) return
        loading = true
        try {
            Tapsell.requestRewardedAd(zoneId, object : RequestResultListener {
                override fun onSuccess(adId: String) {
                    this@TapsellRewardedAds.adId = adId
                    loading = false
                }

                override fun onFailure(message: String) {
                    Log.w(TAG, "rewarded load failed: $message")
                    loading = false
                }
            })
        } catch (t: Throwable) {
            loading = false
            Log.e(TAG, "rewarded request threw", t)
        }
    }

    override fun show(activity: Activity, onEvent: (RewardedAdEvent) -> Unit) {
        val ready = adId
        if (ready == null) {
            onEvent(RewardedAdEvent.Failed("هنوز تبلیغی آماده نیست؛ چند لحظه بعد دوباره تلاش کنید."))
            preload()
            return
        }
        adId = null
        var rewardDelivered = false
        onEvent(RewardedAdEvent.Shown)
        try {
            Tapsell.showRewardedAd(ready, activity, object : AdStateListener.Rewarded {
                override fun onAdImpression() = Unit
                override fun onAdClicked() = Unit

                override fun onRewarded() {
                    // A single SDK reward callback grants exactly one reward for this showing.
                    if (rewardDelivered) return
                    rewardDelivered = true
                    onEvent(RewardedAdEvent.Reward)
                }

                override fun onAdClosed(completionState: AdShowCompletionState) {
                    onEvent(RewardedAdEvent.Closed)
                    preload()
                }

                override fun onAdFailed(message: String) {
                    Log.w(TAG, "rewarded show failed: $message")
                    onEvent(RewardedAdEvent.Failed(message))
                    preload()
                }
            })
        } catch (t: Throwable) {
            Log.e(TAG, "show threw", t)
            onEvent(RewardedAdEvent.Failed("نمایش تبلیغ ناموفق بود."))
            preload()
        }
    }

    companion object {
        private const val TAG = "BlockestanAds"
    }
}

class TapsellInterstitialAds(private val zoneId: String) : InterstitialAds {
    override val simulated = false
    override val configured: Boolean = zoneId.isNotBlank()

    @Volatile
    private var adId: String? = null

    @Volatile
    private var loading = false

    override fun preload() {
        if (!configured || loading || adId != null) return
        loading = true
        try {
            Tapsell.requestInterstitialAd(zoneId, object : RequestResultListener {
                override fun onSuccess(adId: String) {
                    this@TapsellInterstitialAds.adId = adId
                    loading = false
                }

                override fun onFailure(message: String) {
                    Log.w(TAG, "interstitial load failed: $message")
                    loading = false
                }
            })
        } catch (t: Throwable) {
            loading = false
            Log.e(TAG, "interstitial request threw", t)
        }
    }

    override fun show(activity: Activity, onClosed: (Boolean) -> Unit): Boolean {
        val ready = adId ?: run {
            preload()
            return false
        }
        adId = null
        var done = false
        try {
            Tapsell.showInterstitialAd(ready, activity, object : AdStateListener.Interstitial {
                override fun onAdImpression() = Unit
                override fun onAdClicked() = Unit

                override fun onAdClosed(completionState: AdShowCompletionState) {
                    if (!done) {
                        done = true
                        onClosed(true)
                    }
                    preload()
                }

                override fun onAdFailed(message: String) {
                    Log.w(TAG, "interstitial show failed: $message")
                    if (!done) {
                        done = true
                        onClosed(false)
                    }
                    preload()
                }
            })
            return true
        } catch (t: Throwable) {
            Log.e(TAG, "interstitial show threw", t)
            if (!done) {
                done = true
                onClosed(false)
            }
            preload()
            return false
        }
    }

    companion object {
        private const val TAG = "BlockestanAds"
    }
}
