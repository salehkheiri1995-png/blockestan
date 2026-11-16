package ir.blockestan.game.ui

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.util.Numbers

@Composable
fun ShopScreen(ui: GameUiState, vm: GameViewModel, activity: Activity?) {
    val palette = LocalGamePalette.current
    Column(Modifier.fillMaxSize()) {
        TopBar(title = "فروشگاه", onBack = vm::goHome, trailing = { CoinBadge(ui.save.coins) })
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "سکهٔ جایزه‌دار",
                        color = palette.onSurface,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "با انتخاب خودت یک تبلیغ کامل ببین و " +
                            "${Numbers.fa(GameBalanceConfig.REWARDED_AD_COINS)} سکه بگیر. " +
                            "جایزه فقط پس از تأیید واقعی تبلیغ اضافه می‌شود.",
                        color = palette.onSurfaceMuted,
                        fontSize = 12.sp
                    )
                    if (ui.rewardedSimulated) SimulatedBadge()
                    PrimaryButton(
                        text = if (ui.rewardedConfigured) {
                            "تماشای تبلیغ و دریافت ${Numbers.fa(GameBalanceConfig.REWARDED_AD_COINS)} سکه"
                        } else {
                            "تبلیغ جایزه‌دار در دسترس نیست"
                        },
                        enabled = ui.rewardedConfigured && activity != null,
                        onClick = { if (activity != null) vm.requestRewardedCoins(activity) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Text(
                text = "پوسته‌ها",
                color = palette.onSurface,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
            GameThemes.all.forEach { theme ->
                val owned = theme.themeId in ui.save.ownedThemes
                val selected = ui.save.selectedTheme == theme.themeId
                val price = GameBalanceConfig.themePrice(theme.themeId)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(palette.surface)
                        .border(
                            1.dp,
                            if (selected) palette.accent else palette.cellGrid.copy(alpha = 0.35f),
                            RoundedCornerShape(16.dp)
                        )
                        .clickable { vm.chooseTheme(theme.themeId) }
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        theme.pieceColors.take(4).forEach { color ->
                            Box(Modifier.size(14.dp).clip(CircleShape).background(color))
                        }
                    }
                    Column(Modifier.weight(1f)) {
                        Text(text = theme.label, color = palette.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(
                            text = when {
                                selected -> "فعال"
                                owned -> "خریداری‌شده"
                                price == 0 -> "رایگان"
                                else -> "${Numbers.fa(price)} سکه"
                            },
                            color = if (selected) palette.accent else palette.onSurfaceMuted,
                            fontSize = 11.sp
                        )
                    }
                    Text(
                        text = if (owned) "انتخاب" else "خرید",
                        color = if (owned) palette.onSurfaceMuted else palette.accent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(4.dp))
            Text(
                text = "سکه‌ها فقط مجازی‌اند و با بازی، تبلیغ اختیاری یا جایزهٔ روزانه به دست می‌آیند. " +
                    "در این نسخه هیچ خرید پول واقعی، اشتراک یا بازارچه‌ای وجود ندارد.",
                color = palette.onSurfaceMuted,
                fontSize = 10.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            )
        }
    }
}

@Suppress("unused")
private val unusedShopColor: Color = Color.Transparent
