package ir.blockestan.game.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.NEUTRAL_BLOCK_COLOR
import ir.blockestan.game.core.model.colOf
import ir.blockestan.game.core.model.rowOf
import ir.blockestan.game.game.DragUi

/**
 * The board uses logical (row, column) coordinates that never mirror with the UI language.
 * A forced-LTR hit grid makes the coordinate math identical for Persian and any other locale.
 */
@Composable
fun GameBoard(
    board: List<Int>,
    drag: DragUi?,
    lastCleared: List<Int>,
    hammerMode: Boolean,
    inputEnabled: Boolean,
    onCellTap: (Int, Int) -> Unit,
    onPositioned: (LayoutCoordinates) -> Unit,
    modifier: Modifier = Modifier
) {
    val palette = LocalGamePalette.current
    val interaction = remember { MutableInteractionSource() }
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(22.dp))
                .background(palette.boardBackground)
                .onGloballyPositioned(onPositioned)
        ) {
            Canvas(Modifier.fillMaxSize()) {
                val cell = size.width / BOARD_SIZE
                val gap = cell * 0.08f
                val radius = CornerRadius(cell * 0.2f)
                for (row in 0 until BOARD_SIZE) {
                    for (col in 0 until BOARD_SIZE) {
                        val index = row * BOARD_SIZE + col
                        val value = board.getOrElse(index) { 0 }
                        val color = when {
                            value == 0 -> palette.cellEmpty
                            value == NEUTRAL_BLOCK_COLOR -> palette.blockedCell
                            else -> palette.pieceColors[(value - 1).mod(palette.pieceColors.size)]
                        }
                        drawRoundRect(
                            color = color,
                            topLeft = Offset(col * cell + gap / 2f, row * cell + gap / 2f),
                            size = Size(cell - gap, cell - gap),
                            cornerRadius = radius
                        )
                        if (index in lastCleared) {
                            drawRoundRect(
                                color = palette.success.copy(alpha = 0.35f),
                                topLeft = Offset(col * cell + gap / 2f, row * cell + gap / 2f),
                                size = Size(cell - gap, cell - gap),
                                cornerRadius = radius
                            )
                        }
                    }
                }
                drag?.let { current ->
                    val ghost = if (current.valid) palette.validGhost else palette.invalidGhost
                    current.shape.cells.forEach { shapeCell ->
                        val row = current.targetRow + shapeCell.row
                        val col = current.targetCol + shapeCell.col
                        if (row in 0 until BOARD_SIZE && col in 0 until BOARD_SIZE) {
                            val left = col * cell + gap / 2f
                            val top = row * cell + gap / 2f
                            val size = Size(cell - gap, cell - gap)
                            drawRoundRect(
                                color = ghost,
                                topLeft = Offset(left, top),
                                size = size,
                                cornerRadius = radius
                            )
                            if (current.valid) {
                                // A solid outline marks a valid target without relying on color.
                                drawRoundRect(
                                    color = palette.accent.copy(alpha = 0.95f),
                                    topLeft = Offset(left, top),
                                    size = size,
                                    cornerRadius = radius,
                                    style = Stroke(width = cell * 0.055f)
                                )
                            } else {
                                // A drawn cross marks an invalid target without relying on color.
                                drawLine(
                                    color = palette.danger,
                                    start = Offset(left + gap, top + gap),
                                    end = Offset(left + size.width - gap, top + size.height - gap),
                                    strokeWidth = cell * 0.07f
                                )
                                drawLine(
                                    color = palette.danger,
                                    start = Offset(left + size.width - gap, top + gap),
                                    end = Offset(left + gap, top + size.height - gap),
                                    strokeWidth = cell * 0.07f
                                )
                            }
                        }
                    }
                }
            }
            if (hammerMode && inputEnabled) {
                Column(Modifier.fillMaxSize()) {
                    repeat(BOARD_SIZE) { row ->
                        Row(Modifier.weight(1f)) {
                            repeat(BOARD_SIZE) { col ->
                                Box(
                                    Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .clickable(
                                            interactionSource = interaction,
                                            indication = null
                                        ) { onCellTap(row, col) }
                                )
                            }
                        }
                    }
                }
                // A light outline signals that the board is in hammer-selection mode.
                Canvas(Modifier.fillMaxSize()) {
                    drawRoundRect(
                        color = palette.danger.copy(alpha = 0.65f),
                        topLeft = Offset(2f, 2f),
                        size = Size(size.width - 4f, size.height - 4f),
                        cornerRadius = CornerRadius(22.dp.toPx()),
                        style = Stroke(width = 3.dp.toPx())
                    )
                }
            }
        }
    }
}

private fun Int.mod(divisor: Int): Int = ((this % divisor) + divisor) % divisor

/** Maps a board index to a readable coordinate for accessibility labels. */
fun cellName(index: Int): String = "سطر ${rowOf(index) + 1}، ستون ${colOf(index) + 1}"
