package ir.blockestan.game;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ir.tapsell.mediation.Tapsell;
import ir.tapsell.mediation.ad.AdStateListener;
import ir.tapsell.mediation.ad.request.BannerSize;
import ir.tapsell.mediation.ad.request.RequestResultListener;
import ir.tapsell.mediation.ad.show.AdShowCompletionState;
import ir.tapsell.mediation.ad.views.banner.BannerContainer;

/**
 * Capacitor bridge for Tapsell Mediation (standard banner + rewarded video).
 *
 * Rewards are always decided by the SDK's {@code onRewarded()} callback, so closing a video
 * early never grants coins. The banner is added directly below the WebView and its height is
 * reported back to the web layer so the UI can keep the bottom navigation clear.
 */
@CapacitorPlugin(name = "TapsellAds")
public class TapsellAdsPlugin extends Plugin {

    private static final String TAG = "TapsellAds";
    private static final long REWARDED_LOAD_TIMEOUT_MS = 20_000L;
    private static final long REWARDED_WATCHDOG_MS = 180_000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private boolean initialized = false;
    private boolean initializeInFlight = false;

    private BannerContainer bannerContainer;
    private String bannerAdId;
    private boolean bannerLoading;
    private boolean bannerVisible;

    private String rewardedAdId;
    private boolean rewardedLoading;
    private PluginCall rewardedCall;
    private boolean rewardedEarned;
    private Runnable rewardedTimer;

    /* ------------------------------- lifecycle ------------------------------ */

    private void ensureInitialized() {
        if (initialized || initializeInFlight) return;
        initializeInFlight = true;
        try {
            Tapsell.initialize(getContext().getApplicationContext());
            initialized = true;
        } catch (Throwable error) {
            Log.e(TAG, "Tapsell initialization failed", error);
        } finally {
            initializeInFlight = false;
        }
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        ensureInitialized();
        preloadRewarded();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        hideBannerInternal();
        super.handleOnDestroy();
    }

    /* -------------------------------- banner -------------------------------- */

    @PluginMethod
    public void showBanner(PluginCall call) {
        ensureInitialized();
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve(bannerState(false, null));
            return;
        }

        bannerVisible = true;

        if (bannerAdId != null) {
            attachBannerContainer(activity);
            displayBanner(activity, bannerAdId);
            call.resolve(bannerState(true, activity));
            return;
        }

        loadBanner(new RequestResultListener() {
            @Override
            public void onSuccess(String adId) {
                mainHandler.post(() -> {
                    bannerAdId = adId;
                    Activity host = getActivity();
                    if (bannerVisible && host != null) {
                        attachBannerContainer(host);
                        displayBanner(host, adId);
                        call.resolve(bannerState(true, host));
                    } else {
                        call.resolve(bannerState(false, null));
                    }
                });
            }

            @Override
            public void onFailure(String message) {
                mainHandler.post(() -> {
                    Log.w(TAG, "Banner request failed: " + message);
                    // The game stays fully usable without a banner; no space is reserved.
                    call.resolve(bannerState(false, null));
                });
            }
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        hideBannerInternal();
        call.resolve();
    }

    private void loadBanner(RequestResultListener listener) {
        if (bannerAdId != null || bannerLoading) {
            if (bannerAdId != null) {
                listener.onSuccess(bannerAdId);
            }
            return;
        }
        bannerLoading = true;
        try {
            Tapsell.requestBannerAd(
                    TapsellConfig.BANNER_ZONE_ID,
                    BannerSize.BANNER_320_50,
                    new RequestResultListener() {
                        @Override
                        public void onSuccess(String adId) {
                            bannerLoading = false;
                            listener.onSuccess(adId);
                        }

                        @Override
                        public void onFailure(String message) {
                            bannerLoading = false;
                            listener.onFailure(message);
                        }
                    }
            );
        } catch (Throwable error) {
            bannerLoading = false;
            listener.onFailure(error.getMessage() == null ? "Banner request failed" : error.getMessage());
        }
    }

    private void attachBannerContainer(Activity activity) {
        if (bannerContainer == null) {
            try {
                bannerContainer = new BannerContainer(activity);
                bannerContainer.setBackgroundColor(Color.TRANSPARENT);
            } catch (Throwable error) {
                Log.e(TAG, "Creating banner container failed", error);
                bannerContainer = null;
                bannerVisible = false;
                return;
            }
        }

        ViewGroup root;
        try {
            root = activity.findViewById(android.R.id.content);
        } catch (Throwable error) {
            root = null;
        }
        if (root == null) return;
        if (bannerContainer.getParent() == root) {
            bannerContainer.setVisibility(View.VISIBLE);
            return;
        }
        if (bannerContainer.getParent() instanceof ViewGroup) {
            ((ViewGroup) bannerContainer.getParent()).removeView(bannerContainer);
        }

        try {
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    Math.round(50f * activity.getResources().getDisplayMetrics().density)
            );
            params.gravity = Gravity.BOTTOM;
            root.addView(bannerContainer, params);
            bannerContainer.setVisibility(View.VISIBLE);
            applyBannerInset(root);
        } catch (Throwable error) {
            Log.e(TAG, "Attaching banner failed", error);
        }
    }

    /** Keeps the banner above the gesture navigation bar on edge-to-edge devices. */
    private void applyBannerInset(ViewGroup root) {
        if (bannerContainer == null) return;
        ViewGroup.LayoutParams raw = bannerContainer.getLayoutParams();
        if (!(raw instanceof FrameLayout.LayoutParams)) return;
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) raw;
        params.bottomMargin = bottomInsetPx(root);
        bannerContainer.setLayoutParams(params);
    }

    private int bottomInsetPx(View view) {
        WindowInsets insets = view.getRootWindowInsets();
        if (insets == null) return 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return insets.getInsets(WindowInsets.Type.systemBars()).bottom;
        }
        return insets.getSystemWindowInsetBottom();
    }

    private void displayBanner(Activity activity, String adId) {
        if (bannerContainer == null) return;
        try {
            Tapsell.showBannerAd(adId, bannerContainer, activity);
        } catch (Throwable error) {
            Log.e(TAG, "Showing banner failed", error);
        }
    }

    private void hideBannerInternal() {
        bannerVisible = false;
        if (bannerContainer != null) {
            try {
                bannerContainer.setVisibility(View.GONE);
                ViewGroup parent = (ViewGroup) bannerContainer.getParent();
                if (parent != null) parent.removeView(bannerContainer);
            } catch (Throwable error) {
                Log.w(TAG, "Hiding banner failed", error);
            }
        }
        if (bannerAdId != null) {
            try {
                Tapsell.destroyBannerAd(bannerAdId);
            } catch (Throwable error) {
                Log.w(TAG, "Destroying banner failed", error);
            }
            bannerAdId = null;
        }
    }

    private JSObject bannerState(boolean visible, Activity activity) {
        JSObject result = new JSObject();
        result.put("visible", visible);
        result.put("height", visible ? bannerHeightDp(activity) : 0);
        return result;
    }

    private double bannerHeightDp(Activity activity) {
        if (activity == null) return 50;
        float density = activity.getResources().getDisplayMetrics().density;
        ViewGroup root = activity.findViewById(android.R.id.content);
        int inset = root == null ? 0 : bottomInsetPx(root);
        return Math.round((50f * density + inset) / density);
    }

    /* ------------------------------- rewarded ------------------------------- */

    @PluginMethod
    public void showRewarded(PluginCall call) {
        ensureInitialized();
        if (rewardedCall != null) {
            call.reject("A rewarded video request is already running.");
            return;
        }

        call.setKeepAlive(true);
        rewardedCall = call;
        rewardedEarned = false;

        if (rewardedAdId != null) {
            showRewardedNow();
            return;
        }

        scheduleRewardedTimeout(REWARDED_LOAD_TIMEOUT_MS, "load-timeout");
        preloadRewarded();
    }

    private void preloadRewarded() {
        if (rewardedAdId != null || rewardedLoading) return;
        rewardedLoading = true;
        try {
            Tapsell.requestRewardedAd(TapsellConfig.REWARDED_ZONE_ID, new RequestResultListener() {
                @Override
                public void onSuccess(String adId) {
                    mainHandler.post(() -> {
                        rewardedLoading = false;
                        rewardedAdId = adId;
                        if (rewardedCall != null) {
                            showRewardedNow();
                        }
                    });
                }

                @Override
                public void onFailure(String message) {
                    mainHandler.post(() -> {
                        rewardedLoading = false;
                        Log.w(TAG, "Rewarded request failed: " + message);
                        if (rewardedCall != null) {
                            finishRewarded("failed", message);
                        }
                    });
                }
            });
        } catch (Throwable error) {
            rewardedLoading = false;
            finishRewarded("failed", error.getMessage());
        }
    }

    private void showRewardedNow() {
        Activity activity = getActivity();
        String adId = rewardedAdId;
        rewardedAdId = null;

        if (activity == null || activity.isFinishing()) {
            finishRewarded("failed", "Activity is not available");
            return;
        }
        if (adId == null) {
            finishRewarded("failed", "Rewarded ad is not ready");
            return;
        }

        scheduleRewardedTimeout(REWARDED_WATCHDOG_MS, "watchdog");

        try {
            Tapsell.showRewardedAd(adId, activity, new AdStateListener.Rewarded() {
                @Override
                public void onAdClicked() {
                    // No-op.
                }

                @Override
                public void onAdImpression() {
                    JSObject data = new JSObject();
                    data.put("shown", true);
                    notifyListeners("rewardedShown", data);
                }

                @Override
                public void onRewarded() {
                    markRewardedEarned();
                    finishRewarded("rewarded", null);
                }

                @Override
                public void onAdClosed(AdShowCompletionState completionState) {
                    if (completionState == AdShowCompletionState.COMPLETED) {
                        markRewardedEarned();
                        finishRewarded("rewarded", null);
                    } else {
                        finishRewarded(rewardedEarned ? "rewarded" : "closed", null);
                    }
                    preloadRewarded();
                }

                @Override
                public void onAdFailed(String message) {
                    finishRewarded("failed", message);
                    preloadRewarded();
                }
            });
        } catch (Throwable error) {
            finishRewarded("failed", error.getMessage());
            preloadRewarded();
        }
    }

    private void markRewardedEarned() {
        if (rewardedEarned) return;
        rewardedEarned = true;
        try {
            JSObject data = new JSObject();
            data.put("earned", true);
            notifyListeners("rewarded", data);
        } catch (Throwable ignored) {
        }
    }

    private void scheduleRewardedTimeout(long delayMs, String reason) {
        clearRewardedTimer();
        rewardedTimer = () -> finishRewarded(rewardedEarned ? "rewarded" : "failed", reason);
        mainHandler.postDelayed(rewardedTimer, delayMs);
    }

    private void clearRewardedTimer() {
        if (rewardedTimer != null) {
            mainHandler.removeCallbacks(rewardedTimer);
            rewardedTimer = null;
        }
    }

    private void finishRewarded(String status, String message) {
        clearRewardedTimer();
        PluginCall call = rewardedCall;
        rewardedCall = null;
        if (call == null) return;

        JSObject result = new JSObject();
        result.put("status", status);
        if (message != null) result.put("message", message);
        call.resolve(result);
    }
}
