package ir.blockestan.game

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.ui.AppRoot
import ir.blockestan.game.ui.BlockestanTheme

class MainActivity : ComponentActivity() {
    private val gameViewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val container = (application as BlockestanApp).container
        container.ads.registerInitializationListener(
            activityProvider = { this },
            consent = { container.repository.save.value.personalizedAdsConsent }
        )
        container.ads.preload()

        setContent {
            val ui by gameViewModel.uiState.collectAsStateWithLifecycle()
            BlockestanTheme(
                themeId = ui.save.selectedTheme,
                reduceMotion = ui.save.reduceMotion
            ) {
                AppRoot(ui = ui, vm = gameViewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val container = (application as BlockestanApp).container
        container.ads.applyConsent(this, container.repository.save.value.personalizedAdsConsent)
    }
}
