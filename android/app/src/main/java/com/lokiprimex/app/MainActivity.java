package com.lokiprimex.app;

import android.os.Bundle;
import android.content.Intent;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (Intent.ACTION_ASSIST.equals(getIntent().getAction())) {
            if (bridge != null) {
                bridge.executeScript("window.isAssistantLaunch = true; window.dispatchEvent(new Event('assistantLaunch'));");
            }
        }
    }
}
