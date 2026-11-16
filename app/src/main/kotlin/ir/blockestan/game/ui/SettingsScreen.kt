package ir.blockestan.game.ui

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.BuildConfig
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.util.Numbers

@Composable
fun SettingsScreen(ui: GameUiState, vm: GameViewModel, activity: Activity?) {
    val palette = LocalGamePalette.current
    var confirmReset by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        TopBar(title = "تنظیمات", onBack = vm::goHome)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SettingGroup {
                SettingSwitch(
                    title = "صدا",
                    subtitle = "صدای چیدن قطعه و پاک‌شدن خط",
                    checked = ui.save.soundEnabled,
                    onChange = vm::setSoundEnabled
                )
                SettingSwitch(
                    title = "لرزش",
                    subtitle = "بازخورد لمسی کوتاه",
                    checked = ui.save.vibrationEnabled,
                    onChange = vm::setVibrationEnabled
                )
                SettingSwitch(
                    title = "کاهش حرکت",
                    subtitle = "حذف انیمیشن‌های غیرضروری",
                    checked = ui.save.reduceMotion,
                    onChange = vm::setReduceMotion
                )
            }

            SettingGroup {
                SettingSwitch(
                    title = "تبلیغ شخصی‌سازی‌شده",
                    subtitle = if (ui.rewardedConfigured) {
                        "انتخاب شما به SDK تبلیغات منتقل می‌شود. رد این گزینه، تبلیغ را حذف نمی‌کند."
                    } else {
                        "تبلیغی پیکربندی نشده است."
                    },
                    checked = ui.save.personalizedAdsConsent,
                    enabled = ui.rewardedConfigured && activity != null,
                    onChange = { enabled ->
                        if (activity != null) vm.setPersonalizedConsent(activity, enabled)
                    }
                )
                Text(
                    text = "وضعیت تبلیغ: ${ui.adStatusLabel}",
                    color = palette.onSurfaceMuted,
                    fontSize = 11.sp
                )
            }

            SettingGroup {
                ActionRow("حریم خصوصی و داده‌ها", vm::openPrivacy)
                ActionRow("پاک‌کردن پیشرفت", { confirmReset = true }, danger = true)
            }

            Text(
                text = "بلوکستان ${BuildConfig.VERSION_NAME}\n" +
                    "موتور بازی نسخهٔ مستقل JVM · ${Numbers.fa(60)} مرحلهٔ اعتبارسنجی‌شده\n" +
                    "بدون حساب کاربری، سرور یا ابزار تحلیلی",
                color = palette.onSurfaceMuted,
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
            )
        }
    }

    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("پاک‌کردن پیشرفت") },
            text = {
                Text(
                    "مرحله‌های بازشده، ستاره‌ها، رکورد و بازی نیمه‌تمام پاک می‌شوند. " +
                        "سکه‌ها و پوسته‌های خریداری‌شده باقی می‌مانند."
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    confirmReset = false
                    vm.resetProgress()
                }) { Text("پاک کن") }
            },
            dismissButton = {
                TextButton(onClick = { confirmReset = false }) { Text("لغو") }
            }
        )
    }
}

@Composable
private fun SettingGroup(content: @Composable () -> Unit) {
    val palette = LocalGamePalette.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(palette.surface)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        content()
    }
}

@Composable
private fun SettingSwitch(
    title: String,
    subtitle: String,
    checked: Boolean,
    enabled: Boolean = true,
    onChange: (Boolean) -> Unit
) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(text = title, color = palette.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text(text = subtitle, color = palette.onSurfaceMuted, fontSize = 10.sp)
        }
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedThumbColor = palette.onAccent,
                checkedTrackColor = palette.accent
            )
        )
    }
}

@Composable
private fun ActionRow(title: String, onClick: () -> Unit, danger: Boolean = false) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(palette.surfaceElevated)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            color = if (danger) palette.danger else palette.onSurface,
            fontSize = 13.sp,
            modifier = Modifier.weight(1f)
        )
        Text(text = "‹", color = palette.onSurfaceMuted, fontSize = 20.sp)
    }
}
