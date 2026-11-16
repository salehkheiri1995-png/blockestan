package ir.blockestan.game.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.core.generation.LevelCatalog
import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.util.Numbers

@Composable
fun LevelsScreen(ui: GameUiState, vm: GameViewModel) {
    val palette = LocalGamePalette.current
    Column(Modifier.fillMaxSize()) {
        TopBar(title = "۶۰ مرحله", onBack = vm::goHome)
        Column(Modifier.padding(horizontal = 14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "با برد در هر مرحله، مرحلهٔ بعد باز می‌شود. " +
                    "همهٔ مرحله‌ها دارای راه‌حل مرجع آزمایش‌شده‌اند.",
                color = palette.onSurfaceMuted,
                fontSize = 11.sp
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Legend("آسان", palette.success)
                Legend("متوسط", palette.accent)
                Legend("سخت", palette.danger)
                Legend("باز‌نشده", palette.cellGrid)
            }
        }
        LazyVerticalGrid(
            columns = GridCells.Adaptive(64.dp),
            modifier = Modifier.fillMaxSize().padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(LevelCatalog.levels, key = { it.id }) { level ->
                val unlocked = level.id <= ui.save.unlockedLevel
                val stars = ui.save.levelStars[level.id] ?: 0
                LevelCell(
                    id = level.id,
                    stars = stars,
                    unlocked = unlocked,
                    difficulty = level.difficulty,
                    onClick = { vm.startLevel(level.id) }
                )
            }
        }
    }
}

@Composable
private fun Legend(label: String, color: androidx.compose.ui.graphics.Color) {
    val palette = LocalGamePalette.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .padding(end = 4.dp)
                .background(color, RoundedCornerShape(50))
                .padding(4.dp)
        )
        Text(text = label, color = palette.onSurfaceMuted, fontSize = 10.sp)
    }
}

@Composable
private fun LevelCell(
    id: Int,
    stars: Int,
    unlocked: Boolean,
    difficulty: Difficulty,
    onClick: () -> Unit
) {
    val palette = LocalGamePalette.current
    val accent = when (difficulty) {
        Difficulty.EASY -> palette.success
        Difficulty.NORMAL -> palette.accent
        Difficulty.HARD -> palette.danger
    }
    Column(
        modifier = Modifier
            .aspectRatio(0.9f)
            .clip(RoundedCornerShape(14.dp))
            .background(if (unlocked) palette.surface else palette.surface.copy(alpha = 0.45f))
            .border(
                1.dp,
                if (unlocked) accent.copy(alpha = 0.55f) else palette.cellGrid.copy(alpha = 0.3f),
                RoundedCornerShape(14.dp)
            )
            .clickable(onClick = onClick)
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = if (unlocked) Numbers.fa(id) else "قفل",
            color = if (unlocked) palette.onSurface else palette.onSurfaceMuted,
            fontWeight = FontWeight.Bold,
            fontSize = if (unlocked) 18.sp else 10.sp,
            textAlign = TextAlign.Center
        )
        if (unlocked) {
            StarRow(stars = stars, size = 10)
            // Difficulty is written out, not conveyed by color alone.
            Text(
                text = when (difficulty) {
                    Difficulty.EASY -> "آسان"
                    Difficulty.NORMAL -> "متوسط"
                    Difficulty.HARD -> "سخت"
                },
                color = accent,
                fontSize = 8.sp
            )
        } else {
            Text(text = "🔒", fontSize = 10.sp)
        }
    }
}
