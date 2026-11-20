package ir.blockestan.game;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Date;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        installCrashLogger();
        // Registered before super.onCreate so the bridge picks the plugin up.
        registerPlugin(TapsellAdsPlugin.class);
        registerPlugin(BazaarIABPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * Writes any uncaught crash (including crashes on background threads, e.g. inside the
     * ad SDK) to a small log file so it can be retrieved from the device without adb.
     * The app still crashes normally afterwards; this only records the stack trace.
     */
    private void installCrashLogger() {
        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                File dir = getExternalFilesDir(null);
                if (dir != null) {
                    File log = new File(dir, "crash.log");
                    StringBuilder sb = new StringBuilder();
                    sb.append("[CRASH] ").append(new Date()).append(" on ").append(thread.getName()).append('\n');
                    Throwable t = throwable;
                    while (t != null) {
                        sb.append(t).append('\n');
                        for (StackTraceElement el : t.getStackTrace()) {
                            sb.append("  at ").append(el).append('\n');
                        }
                        t = t.getCause();
                        if (t != null) sb.append("Caused by: ");
                    }
                    sb.append('\n');
                    try (FileOutputStream fos = new FileOutputStream(log, true)) {
                        fos.write(sb.toString().getBytes("UTF-8"));
                    }
                }
            } catch (Throwable ignored) {
                // Logging must never make things worse.
            }
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable);
            }
        });
    }
}
