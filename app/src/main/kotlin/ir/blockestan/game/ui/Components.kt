package ir.blockestan.game.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.util.Numbers

fun Context.findActivity(): Activity? {
    var context = this
    while (context is ContextWrapper) {
        if (context is Activity) return context
        context = context.baseContext
    }
    return null
}

@Composable
fun CoinBadge(coins: Int, modifier: Modifier = Modifier) {
    val palette = LocalGamePalette.current
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(palette.surfaceElevated)
            .border(1.dp, palette.cellGrid, RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(palette.gold)
        )
        Text(
            text = Numbers.grouped(coins),
            color = palette.onSurface,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
        )
        Text(text = "سکه", color = palette.onSurfaceMuted, fontSize = 12.sp)
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    val palette = LocalGamePalette.current
    Button(
        onClick = onClick,
        modifier = modifier.height(52.dp),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = palette.accent,
            contentColor = palette.onAccent,
            disabledContainerColor = palette.surfaceElevated,
            disabledContentColor = palette.onSurfaceMuted
        )
    ) {
        Text(text = text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    val palette = LocalGamePalette.current
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        enabled = enabled,
        shape = RoundedCornerShape(14.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, palette.cellGrid),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = palette.onSurface)
    ) {
        Text(text = text, fontWeight = FontWeight.Medium, fontSize = 14.sp)
    }
}

@Composable
fun SectionCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val palette = LocalGamePalette.current
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = palette.surface,
        tonalElevation = 0.dp
    ) {
        Box(Modifier.padding(16.dp)) { content() }
    }
}

@Composable
fun TopBar(
    title: String,
    onBack: () -> Unit,
    trailing: @Composable (() -> Unit)? = null
) {
    val palette = LocalGamePalette.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier
                .clip(RoundedCornerShape(12.dp))
                .clickable(onClick = onBack)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(text = "→", color = palette.onSurface, fontSize = 22.sp)
        }
        Text(
            text = title,
            color = palette.onSurface,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.Start
        )
        trailing?.invoke()
    }
}

@Composable
fun StarRow(stars: Int, size: Int = 18, dim: Boolean = false) {
    val palette = LocalGamePalette.current
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        repeat(3) { index ->
            Text(
                text = "★",
                fontSize = size.sp,
                color = if (index < stars) palette.gold else palette.cellGrid.copy(alpha = if (dim) 0.5f else 1f)
            )
        }
    }
}

@Composable
fun StatPill(label: String, value: String, modifier: Modifier = Modifier) {
    val palette = LocalGamePalette.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(palette.surface)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = value, color = palette.onSurface, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text(text = label, color = palette.onSurfaceMuted, fontSize = 11.sp)
    }
}

/**
 * Draws a piece inside its bounding box. [cell] is the full cell size; blocks are inset so
 * the grid gap is visible. Used by the tray and by the lifted drag overlay.
 */
fun androidx.compose.ui.graphics.drawscope.DrawScope.drawPiece(
    shape: ir.blockestan.game.core.model.PieceShape,
    color: Color,
    cell: Float,
    origin: Offset,
    alpha: Float = 1f
) {
    val gap = cell * 0.1f
    val radius = CornerRadius(cell * 0.22f)
    shape.cells.forEach { cellPos ->
        drawRoundRect(
            color = color.copy(alpha = alpha),
            topLeft = Offset(
                origin.x + cellPos.col * cell + gap / 2f,
                origin.y + cellPos.row * cell + gap / 2f
            ),
            size = Size(cell - gap, cell - gap),
            cornerRadius = radius
        )
    }
}

@Composable
fun EmptyState(text: String) {
    Text(
        text = text,
        color = LocalGamePalette.current.onSurfaceMuted,
        fontSize = 14.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(24.dp)
    )
}

@Composable
fun SpacerH(height: Dp) = Spacer(Modifier.height(height))
