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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.util.DateKeys
import ir.blockestan.game.util.Numbers

@Composable
fun HomeScreen(ui: GameUiState, vm: GameViewModel, activity: Activity?) {
    val palette = LocalGamePalette.current
    val save = ui.save
    val active = save.activeRun?.takeIf { it.state.status == RunStatus.PLAYING }
    val totalStars = save.levelStars.values.sum()
    val today = DateKeys.today()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    text = "بلوکستان",
                    color = palette.onSurface,
                    fontWeight = FontWeight.Bold,
                    fontSize = 30.sp
                )
                Text(
                    text = "پازل بلوکی ۸×۸",
                    color = palette.onSurfaceMuted,
                    fontSize = 12.sp
                )
            }
            CoinBadge(save.coins)
        }

        if (active != null) {
            ModeCard(
                title = "ادامهٔ بازی",
                subtitle = when (active.mode) {
                    GameMode.LEVEL -> "مرحلهٔ ${Numbers.fa(active.levelId ?: 0)}"
                    GameMode.DAILY -> "چالش روزانه"
                    else -> "حالت بی‌پایان"
                },
                detail = "${Numbers.fa(active.state.score)} امتیاز",
                accent = true,
                onClick = vm::resumeActive
            )
        }

        ModeCard(
            title = "حالت بی‌پایان",
            subtitle = "تا جای ممکن بازی کن و رکورد بزن",
            detail = "بهترین رکورد: ${Numbers.grouped(save.classicBest)}",
            onClick = vm::startClassic
        )

        ModeCard(
            title = "۶۰ مرحله",
            subtitle = "مرحله‌های دست‌ساز با هدف مشخص",
            detail = "مرحله‌های باز: ${Numbers.fa(save.unlockedLevel)} از " +
                "${Numbers.fa(GameBalanceConfig.TOTAL_LEVELS)} · ${Numbers.fa(totalStars)} ستاره",
            onClick = vm::openLevels
        )

        ModeCard(
            title = "چالش روزانه",
            subtitle = "یک زمین مشترک برای امروز، بدون اینترنت",
            detail = if (save.daily.dayKey == today) {
                "بهترین امروز: ${Numbers.grouped(save.daily.bestScore)}" +
                    if (save.daily.rewardClaimed) " · جایزه گرفته شد" else ""
            } else {
                "امروز هنوز بازی نکرده‌ای"
            },
            onClick = vm::startDaily
        )

        if (ui.rewardedConfigured && activity != null) {
            SectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "سکهٔ رایگان با تبلیغ",
                        color = palette.onSurface,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Text(
                        text = "با انتخاب خودت یک تبلیغ جایزه‌دار ببین و " +
                            "${Numbers.fa(GameBalanceConfig.REWARDED_AD_COINS)} سکه بگیر. " +
                            "این کار اختیاری است و هیچ پیشرفتی را قفل نمی‌کند.",
                        color = palette.onSurfaceMuted,
                        fontSize = 12.sp
                    )
                    if (ui.rewardedSimulated) {
                        SimulatedBadge()
                    }
                    PrimaryButton(
                        text = "تماشای تبلیغ و دریافت ${Numbers.fa(GameBalanceConfig.REWARDED_AD_COINS)} سکه",
                        onClick = { vm.requestRewardedCoins(activity) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FooterButton("فروشگاه", Modifier.weight(1f), vm::openShop)
            FooterButton("تنظیمات", Modifier.weight(1f), vm::openSettings)
            FooterButton("حریم خصوصی", Modifier.weight(1f), vm::openPrivacy)
        }

        Text(
            text = "همهٔ سکه‌ها مجازی‌اند و خرید پول واقعی وجود ندارد. " +
                "بازی آفلاین است؛ فقط تبلیغ اختیاری به اینترنت نیاز دارد.",
            color = palette.onSurfaceMuted,
            fontSize = 10.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
        )
        if (ui.rewardedSimulated) {
            Text(
                text = "نسخهٔ آزمایشی: تبلیغ شبیه‌سازی‌شده است و درآمدی ایجاد نمی‌کند.",
                color = palette.onSurfaceMuted,
                fontSize = 10.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
            )
        }
    }
}

@Composable
private fun ModeCard(
    title: String,
    subtitle: String,
    detail: String,
    onClick: () -> Unit,
    accent: Boolean = false
) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(if (accent) palette.accent.copy(alpha = 0.18f) else palette.surface)
            .border(
                1.dp,
                if (accent) palette.accent else palette.cellGrid.copy(alpha = 0.35f),
                RoundedCornerShape(18.dp)
            )
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(text = title, color = palette.onSurface, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(text = subtitle, color = palette.onSurfaceMuted, fontSize = 11.sp)
            Text(text = detail, color = palette.accent, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }
        Text(text = "‹", color = palette.onSurfaceMuted, fontSize = 26.sp)
    }
}

@Composable
private fun FooterButton(text: String, modifier: Modifier, onClick: () -> Unit) {
    val palette = LocalGamePalette.current
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(palette.surface)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, color = palette.onSurface, fontSize = 12.sp)
    }
}

@Composable
fun SimulatedBadge() {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(palette.gold.copy(alpha = 0.2f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "شبیه‌سازی‌شده · بدون درآمد",
            color = palette.gold,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Suppress("unused")
private val unusedHomeSpacer: Unit = Unit
