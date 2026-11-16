package ir.blockestan.game.ui

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.game.Screen
import kotlinx.coroutines.delay

@Composable
fun AppRoot(ui: GameUiState, vm: GameViewModel) {
    val activity: Activity? = LocalContext.current.findActivity()
    val palette = LocalGamePalette.current
    var snackVisible by remember { mutableStateOf(false) }

    BackHandler(enabled = ui.screen != Screen.HOME || ui.result != null) {
        vm.back()
    }

    LaunchedEffect(ui.snack) {
        if (ui.snack == null) {
            snackVisible = false
        } else {
            snackVisible = true
            delay(3_500)
            snackVisible = false
            vm.dismissSnack()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.backgroundBrush)
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        when (ui.screen) {
            Screen.HOME -> HomeScreen(ui = ui, vm = vm, activity = activity)
            Screen.LEVELS -> LevelsScreen(ui = ui, vm = vm)
            Screen.GAME -> GameScreen(ui = ui, vm = vm, activity = activity)
            Screen.SHOP -> ShopScreen(ui = ui, vm = vm, activity = activity)
            Screen.SETTINGS -> SettingsScreen(ui = ui, vm = vm, activity = activity)
            Screen.PRIVACY -> PrivacyScreen(vm = vm)
        }

        AnimatedVisibility(
            visible = snackVisible && ui.snack != null,
            enter = fadeIn() + slideInVertically { it / 2 },
            exit = fadeOut() + slideOutVertically { it / 2 },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 18.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(palette.surfaceElevated)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = ui.snack.orEmpty(),
                    color = palette.onSurface,
                    fontSize = 12.sp,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "بستن",
                    color = palette.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .padding(start = 12.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable {
                            snackVisible = false
                            vm.dismissSnack()
                        }
                        .padding(horizontal = 6.dp, vertical = 4.dp)
                )
            }
        }
    }

    if (ui.ad.showing && ui.ad.simulated) {
        SimulatedAdOverlay(ui = ui)
    }
}

@Composable
private fun SimulatedAdOverlay(ui: GameUiState) {
    val palette = LocalGamePalette.current
    androidx.compose.ui.window.Dialog(
        onDismissRequest = { },
        properties = androidx.compose.ui.window.DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(palette.surfaceElevated)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            CircularProgressIndicator(color = palette.accent)
            Text(
                text = "تبلیغ شبیه‌سازی‌شده",
                color = palette.onSurface,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
            Text(
                text = "این نسخهٔ آزمایشی است؛ تبلیغ واقعی نمایش داده نمی‌شود " +
                    "و هیچ درآمدی ایجاد نمی‌کند. جایزه فقط به‌صورت آزمایشی اضافه می‌شود.",
                color = palette.onSurfaceMuted,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            Text(
                text = if (ui.ad.purpose == ir.blockestan.game.game.RewardPurpose.CONTINUE) {
                    "در حال آماده‌سازی ادامهٔ بازی…"
                } else {
                    "در حال آماده‌سازی جایزه…"
                },
                color = palette.accent,
                fontSize = 11.sp
            )
        }
    }
}
