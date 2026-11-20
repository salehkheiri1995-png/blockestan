package ir.blockestan.game;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.activity.ComponentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ir.cafebazaar.poolakey.Payment;
import ir.cafebazaar.poolakey.config.PaymentConfiguration;
import ir.cafebazaar.poolakey.config.SecurityCheck;
import ir.cafebazaar.poolakey.entity.PurchaseInfo;
import ir.cafebazaar.poolakey.request.PurchaseRequest;

import kotlin.Unit;
import kotlin.jvm.functions.Function0;
import kotlin.jvm.functions.Function1;

/**
 * Capacitor bridge to Cafe Bazaar (Poolakey) in-app billing.
 *
 * Purchases only succeed when Poolakey verifies the purchase signature against the developer RSA
 * public key (see {@link BazaarConfig}). The web layer is told whether the purchase was a genuine,
 * verified success, cancelled, or failed.
 */
@CapacitorPlugin(name = "BazaarIAB")
public class BazaarIABPlugin extends Plugin {

    private static final String TAG = "BazaarIAB";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private Payment payment;

    private Payment payment() {
        if (payment == null) {
            try {
                payment = new Payment(
                        getContext().getApplicationContext(),
                        new PaymentConfiguration(
                                new SecurityCheck.Enable(BazaarConfig.RSA_PUBLIC_KEY),
                                true
                        )
                );
            } catch (Throwable error) {
                Log.e(TAG, "Failed to create Payment", error);
            }
        }
        return payment;
    }

    /** Reports whether billing is usable (bazaar installed). Best-effort: resolves true. */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", payment() != null);
        call.resolve(result);
    }

    @PluginMethod
    public void launchPurchaseFlow(PluginCall call) {
        final String sku = call.getString("sku");
        final String payload = call.getString("developerPayload", "blockestan-payload");
        if (sku == null || sku.isEmpty()) {
            call.reject("Missing sku");
            return;
        }

        final Payment p = payment();
        if (p == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "پرداخت کافه‌بازار در دسترس نیست");
            call.resolve(result);
            return;
        }

        call.setKeepAlive(true);

        final ComponentActivity activity = getActivity() instanceof ComponentActivity
                ? (ComponentActivity) getActivity()
                : null;
        if (activity == null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("errorMessage", "فعالیت در دسترس نیست");
            call.resolve(result);
            return;
        }

        // Also connect (binds to Bazaar's billing service). Best-effort.
        try {
            p.connect(cb -> {
                cb.connectionSucceed(() -> {
                    Log.i(TAG, "Bazaar billing connected");
                    return Unit.INSTANCE;
                });
                cb.connectionFailed(t -> {
                    Log.w(TAG, "Bazaar connection failed", t);
                    return Unit.INSTANCE;
                });
                cb.disconnected(() -> Unit.INSTANCE);
                return Unit.INSTANCE;
            });
        } catch (Throwable error) {
            Log.w(TAG, "connect() threw", error);
        }

        final PurchaseRequest request = new PurchaseRequest(sku, payload, null);

        Function1<ir.cafebazaar.poolakey.callback.PurchaseCallback, Unit> block = cb -> {
            cb.purchaseSucceed(info -> {
                handleSuccess(call, info);
                consume(p, info);
                return Unit.INSTANCE;
            });
            cb.purchaseCanceled(() -> {
                resolve(call, false, true, null, "لغو توسط کاربر");
                return Unit.INSTANCE;
            });
            cb.purchaseFailed(t -> {
                resolve(call, false, false, null, messageOf(t));
                return Unit.INSTANCE;
            });
            cb.failedToBeginFlow(t -> {
                resolve(call, false, false, null, messageOf(t));
                return Unit.INSTANCE;
            });
            cb.purchaseFlowBegan(() -> Unit.INSTANCE);
            return Unit.INSTANCE;
        };

        try {
            p.purchaseProduct(activity.getActivityResultRegistry(), request, block);
        } catch (Throwable error) {
            resolve(call, false, false, null, messageOf(error));
        }
    }

    private void handleSuccess(PluginCall call, PurchaseInfo info) {
        resolve(call, true, false, info.getOrderId(), null);
    }

    private void consume(Payment p, PurchaseInfo info) {
        try {
            p.consumeProduct(info.getPurchaseToken(), cb -> {
                cb.consumeSucceed(() -> Unit.INSTANCE);
                cb.consumeFailed(t -> {
                    Log.w(TAG, "Consume failed", t);
                    return Unit.INSTANCE;
                });
                return Unit.INSTANCE;
            });
        } catch (Throwable error) {
            Log.w(TAG, "consume() threw", error);
        }
    }

    private void resolve(final PluginCall call, final boolean success, final boolean cancelled,
                         final String orderId, final String errorMessage) {
        mainHandler.post(() -> {
            JSObject result = new JSObject();
            result.put("success", success);
            result.put("cancelled", cancelled);
            if (orderId != null) result.put("orderId", orderId);
            if (errorMessage != null) result.put("errorMessage", errorMessage);
            call.resolve(result);
        });
    }

    private static String messageOf(Throwable t) {
        if (t == null) return "خطا در پرداخت کافه‌بازار";
        String m = t.getMessage();
        return m == null || m.isEmpty() ? "خطا در پرداخت کافه‌بازار" : m;
    }
}
