package ir.blockestan.game;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registered before super.onCreate so the bridge picks the plugin up.
        registerPlugin(TapsellAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
