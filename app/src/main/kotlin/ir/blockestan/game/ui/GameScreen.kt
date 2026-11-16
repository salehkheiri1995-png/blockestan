package ir.blockestan.game.ui

import android.app.Activity
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.Cell
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.GoalType
import ir.blockestan.game.core.model.Piece
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.LevelGoal
import ir.blockestan.game.game.DragUi
import ir.blockestan.game.game.GameUiState
import ir.blockestan.game.game.GameViewModel
import ir.blockestan.game.game.ResultUi
import ir.blockestan.game.util.Numbers
import kotlin.math.roundToInt

@Composable
fun GameScreen(
    ui: GameUiState,
    vm: GameViewModel,
    activity: Activity?
) {
    val palette = LocalGamePalette.current
    val density = LocalDensity.current
    var boardOrigin by remember { mutableStateOf(Offset.Zero) }
    var boardCellPx by remember { mutableFloatStateOf(0f) }
    var rootOrigin by remember { mutableStateOf(Offset.Zero) }

    val session = ui.session ?: return
    val boardSizeFallback = with(density) { 26.dp.toPx() }

    fun buildDrag(slot: Int, piece: Piece, pointer: Offset, grab: Cell): DragUi {
        val cell = boardCellPx.takeIf { it > 0f } ?: boardSizeFallback
        val topLeft = pointer - Offset(grab.col * cell, grab.row * cell)
        val relative = topLeft - boardOrigin
        val targetCol = (relative.x / cell).roundToInt()
        val targetRow = (relative.y / cell).roundToInt()
        val valid = vm.canPlace(slot, targetRow, targetCol)
        return DragUi(slot, piece.shape, piece.color, pointer, grab, targetRow, targetCol, valid)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .onGloballyPositioned { rootOrigin = it.positionInRoot() }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp)
        ) {
            GameTopBar(ui, vm)
            if (ui.level != null) {
                GoalsSection(ui, session)
            }
            BoxWithConstraints(
                modifier = Modifier.weight(1f).fillMaxWidth()
            ) {
                val boardSize = minOf(maxWidth * 0.97f, maxHeight * 0.60f)
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    GameBoard(
                        board = session.board,
                        drag = ui.drag,
                        lastCleared = ui.lastCleared,
                        hammerMode = ui.hammerMode,
                        inputEnabled = ui.isPlaying,
                        onCellTap = { row, col -> vm.hammerAt(row, col) },
                        onPositioned = { coordinates ->
                            boardOrigin = coordinates.positionInRoot()
                            boardCellPx = coordinates.size.width / BOARD_SIZE.toFloat()
                        },
                        modifier = Modifier.size(boardSize)
                    )
                    Spacer(Modifier.height(10.dp))
                    TrayRow(
                        ui = ui,
                        onStart = { slot, piece, pointer, grab ->
                            vm.updateDrag(buildDrag(slot, piece, pointer, grab))
                        },
                        onMove = { pointer ->
                            val drag = ui.drag ?: return@TrayRow
                            val piece = ui.session.tray.getOrNull(drag.slot) ?: return@TrayRow
                            vm.updateDrag(buildDrag(drag.slot, piece, pointer, drag.grabCell))
                        },
                        onDrop = { vm.dropDrag() },
                        onCancel = { vm.updateDrag(null) }
                    )
                    if (ui.hammerMode) {
                        HammerBanner(onCancel = { vm.toggleHammer() })
                    }
                    Spacer(Modifier.height(8.dp))
                    BoosterRow(ui = ui, vm = vm)
                }
            }
        }

        ui.drag?.let { drag ->
            DragOverlay(drag = drag, rootOrigin = rootOrigin, fallbackCell = boardSizeFallback)
        }
    }

    if (ui.result != null) {
        ResultDialog(ui = ui, result = ui.result, vm = vm, activity = activity)
    }
}

@Composable
private fun GameTopBar(ui: GameUiState, vm: GameViewModel) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .clickable { vm.goHome() }
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Text("→", color = palette.onSurface, fontSize = 22.sp)
        }
        Column(Modifier.weight(1f)) {
            Text(
                text = when (ui.mode) {
                    GameMode.LEVEL -> "مرحلهٔ ${Numbers.fa(ui.level?.id ?: 0)}"
                    GameMode.DAILY -> "چالش روزانه"
                    else -> "حالت بی‌پایان"
                },
                color = palette.onSurface,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
            Text(
                text = "${Numbers.fa(ui.session?.score ?: 0)} امتیاز",
                color = palette.onSurfaceMuted,
                fontSize = 12.sp
            )
        }
        CoinBadge(ui.save.coins)
    }
}

@Composable
private fun GoalsSection(ui: GameUiState, session: ir.blockestan.game.core.model.GameState) {
    val palette = LocalGamePalette.current
    val level = ui.level ?: return
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(palette.surface)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = level.title,
                color = palette.onSurface,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
            Text(
                text = "${Numbers.fa(maxOf(0, level.moveLimit - session.movesUsed))} حرکت باقی‌مانده",
                color = palette.onSurfaceMuted,
                fontSize = 11.sp
            )
        }
        level.goals.forEach { goal ->
            GoalBar(goal = goal, level = level, session = session)
        }
    }
}

@Composable
private fun GoalBar(
    goal: LevelGoal,
    level: ir.blockestan.game.core.generation.LevelDefinition,
    session: ir.blockestan.game.core.model.GameState
) {
    val palette = LocalGamePalette.current
    val (label, current) = when (goal.type) {
        GoalType.SCORE -> "امتیاز" to session.score
        GoalType.LINES -> "خط" to session.linesCleared
        GoalType.TARGET_CELLS ->
            "خانه‌های هدف" to (level.targetCells.size - session.remainingTargets.size)
    }
    val fraction = (current.toFloat() / goal.target).coerceIn(0f, 1f)
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = label,
            color = palette.onSurfaceMuted,
            fontSize = 11.sp,
            modifier = Modifier.width(76.dp)
        )
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(50)),
            color = if (fraction >= 1f) palette.success else palette.accent,
            trackColor = palette.cellGrid.copy(alpha = 0.5f)
        )
        Text(
            text = "${Numbers.fa(minOf(current, goal.target))}/${Numbers.fa(goal.target)}",
            color = palette.onSurface,
            fontSize = 11.sp,
            modifier = Modifier.width(64.dp),
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun TrayRow(
    ui: GameUiState,
    onStart: (Int, Piece, Offset, Cell) -> Unit,
    onMove: (Offset) -> Unit,
    onDrop: () -> Unit,
    onCancel: () -> Unit
) {
    val palette = LocalGamePalette.current
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val cell = minOf(maxWidth / 16f, 28.dp).coerceAtLeast(16.dp)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(3) { slot ->
                val piece = ui.session?.tray?.getOrNull(slot)
                Box(
                    modifier = Modifier.width(cell * 4).height(cell * 3),
                    contentAlignment = Alignment.Center
                ) {
                    if (piece == null) {
                        Box(
                            modifier = Modifier
                                .size(cell * 2)
                                .clip(RoundedCornerShape(12.dp))
                                .border(1.dp, palette.cellGrid.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        )
                    } else {
                        TrayPieceView(
                            piece = piece,
                            slot = slot,
                            cell = cell,
                            enabled = ui.isPlaying && !ui.hammerMode,
                            onStart = onStart,
                            onMove = onMove,
                            onDrop = onDrop,
                            onCancel = onCancel
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TrayPieceView(
    piece: Piece,
    slot: Int,
    cell: Dp,
    enabled: Boolean,
    onStart: (Int, Piece, Offset, Cell) -> Unit,
    onMove: (Offset) -> Unit,
    onDrop: () -> Unit,
    onCancel: () -> Unit
) {
    val palette = LocalGamePalette.current
    val density = LocalDensity.current
    val cellPx = with(density) { cell.toPx() }
    var itemOrigin by remember { mutableStateOf(Offset.Zero) }
    var dragging by remember { mutableStateOf(false) }
    val color = palette.pieceColors[(piece.color - 1).mod(palette.pieceColors.size)]

    Box(
        modifier = Modifier
            .onGloballyPositioned { itemOrigin = it.positionInRoot() }
            .size(cell * piece.shape.width, cell * piece.shape.height)
            .alpha(if (dragging) 0.28f else 1f)
            .pointerInput(piece, enabled) {
                if (!enabled) return@pointerInput
                var start = Offset.Zero
                var accumulated = Offset.Zero
                detectDragGestures(
                    onDragStart = { local ->
                        start = itemOrigin + local
                        accumulated = Offset.Zero
                        dragging = true
                        val grabRow = (local.y / cellPx).toInt().coerceIn(0, piece.shape.height - 1)
                        val grabCol = (local.x / cellPx).toInt().coerceIn(0, piece.shape.width - 1)
                        onStart(slot, piece, start, Cell(grabRow, grabCol))
                    },
                    onDrag = { change, amount ->
                        change.consume()
                        accumulated += amount
                        onMove(start + accumulated)
                    },
                    onDragEnd = {
                        dragging = false
                        onDrop()
                    },
                    onDragCancel = {
                        dragging = false
                        onCancel()
                    }
                )
            }
    ) {
        Canvas(Modifier.fillMaxSize()) {
            drawPiece(
                shape = piece.shape,
                color = color,
                cell = size.width / piece.shape.width,
                origin = Offset.Zero
            )
        }
    }
}

@Composable
private fun DragOverlay(drag: DragUi, rootOrigin: Offset, fallbackCell: Float) {
    val palette = LocalGamePalette.current
    Canvas(Modifier.fillMaxSize()) {
        val cell = if (fallbackCell > 0f) fallbackCell else 24.dp.toPx()
        val pointerLocal = drag.pointer - rootOrigin
        val topLeft = pointerLocal - Offset(drag.grabCell.col * cell, drag.grabCell.row * cell)
        drawPiece(
            shape = drag.shape,
            color = palette.pieceColors[(drag.color - 1).mod(palette.pieceColors.size)],
            cell = cell,
            origin = topLeft,
            alpha = 0.92f
        )
    }
}

@Composable
private fun HammerBanner(onCancel: () -> Unit) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(palette.danger.copy(alpha = 0.18f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "حالت چکش: روی یک خانه بزن تا محدودهٔ ۳×۳ پاک شود.",
            color = palette.onSurface,
            fontSize = 11.sp,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = "لغو",
            color = palette.danger,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.clickable(onClick = onCancel).padding(8.dp)
        )
    }
}

@Composable
private fun BoosterRow(ui: GameUiState, vm: GameViewModel) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        BoosterButton(
            title = "بازگشت",
            cost = GameBalanceConfig.UNDO_COST,
            enabled = ui.isPlaying,
            modifier = Modifier.weight(1f),
            onClick = vm::requestUndo
        )
        BoosterButton(
            title = "تعویض",
            cost = GameBalanceConfig.SWAP_COST,
            enabled = ui.isPlaying,
            modifier = Modifier.weight(1f),
            onClick = vm::requestSwap
        )
        BoosterButton(
            title = if (ui.hammerMode) "چکش فعال" else "چکش",
            cost = GameBalanceConfig.HAMMER_COST,
            enabled = ui.isPlaying,
            modifier = Modifier.weight(1f),
            highlight = ui.hammerMode,
            onClick = vm::toggleHammer
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .height(52.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(palette.surface)
                .padding(horizontal = 4.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = if (ui.session?.status == RunStatus.PLAYING) "در جریان" else "پایان",
                color = palette.onSurfaceMuted,
                fontSize = 10.sp
            )
            Text(
                text = "حرکت ${Numbers.fa((ui.session?.movesUsed ?: 0))}",
                color = palette.onSurface,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun BoosterButton(
    title: String,
    cost: Int,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    highlight: Boolean = false,
    onClick: () -> Unit
) {
    val palette = LocalGamePalette.current
    Column(
        modifier = modifier
            .height(52.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (highlight) palette.accent.copy(alpha = 0.25f) else palette.surface)
            .border(
                1.dp,
                if (highlight) palette.accent else palette.cellGrid.copy(alpha = 0.4f),
                RoundedCornerShape(12.dp)
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 4.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = title,
            color = palette.onSurface,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = "${Numbers.fa(cost)} سکه",
            color = palette.onSurfaceMuted,
            fontSize = 10.sp
        )
    }
}

@Composable
private fun ResultDialog(
    ui: GameUiState,
    result: ResultUi,
    vm: GameViewModel,
    activity: Activity?
) {
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
                .clip(RoundedCornerShape(24.dp))
                .background(palette.surfaceElevated)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = if (result.won) "آفرین!" else if (result.canContinue) "جای ادامه دارد" else "بازی تمام شد",
                color = palette.onSurface,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
            if (result.won && result.levelId != null) {
                StarRow(stars = result.stars, size = 30)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                StatPill("امتیاز", Numbers.grouped(result.score))
                StatPill("خط", Numbers.fa(result.lines))
                if (result.coinsEarned > 0) {
                    StatPill("سکه", "+${Numbers.fa(result.coinsEarned)}")
                }
            }
            if (result.newPersonalBest) {
                Text("رکورد شخصی جدید!", color = palette.gold, fontSize = 13.sp)
            }
            if (result.dailyReward) {
                Text(
                    text = "جایزهٔ چالش روزانه دریافت شد.",
                    color = palette.success,
                    fontSize = 12.sp
                )
            }
            if (!result.won && result.levelId != null && !result.canContinue) {
                Text(
                    text = "می‌توانی همین مرحله را دوباره امتحان کنی.",
                    color = palette.onSurfaceMuted,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )
            }

            if (result.canContinue) {
                PrimaryButton(
                    text = "ادامه با ${Numbers.fa(GameBalanceConfig.CONTINUE_COST)} سکه",
                    onClick = vm::continueWithCoins,
                    modifier = Modifier.fillMaxWidth()
                )
                if (ui.rewardedConfigured && activity != null) {
                    SecondaryButton(
                        text = if (ui.rewardedSimulated) {
                            "ادامه با تبلیغ شبیه‌سازی‌شده"
                        } else {
                            "ادامه با تماشای تبلیغ"
                        },
                        onClick = { vm.continueWithAd(activity) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                SecondaryButton(
                    text = "پذیرش نتیجه و پایان",
                    onClick = vm::declineContinue,
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                if (result.won && result.nextLevelAvailable && activity != null) {
                    PrimaryButton(
                        text = "مرحلهٔ بعد",
                        onClick = { vm.nextLevel(activity) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                if (activity != null) {
                    if (result.won && result.nextLevelAvailable) {
                        SecondaryButton(
                            text = "تکرار این مرحله",
                            onClick = { vm.playAgain(activity) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        PrimaryButton(
                            text = "بازی دوباره",
                            onClick = { vm.playAgain(activity) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    SecondaryButton(
                        text = "صفحهٔ اصلی",
                        onClick = { vm.homeFromResult(activity) },
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    PrimaryButton(
                        text = "بازگشت",
                        onClick = vm::goHome,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
