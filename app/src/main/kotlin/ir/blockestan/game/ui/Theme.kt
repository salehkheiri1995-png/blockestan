package ir.blockestan.game.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import ir.blockestan.game.R

/** Every color that is not part of the Material scheme, kept in one inspectable place. */
data class GamePalette(
    val themeId: String,
    val label: String,
    val dark: Boolean,
    val backgroundTop: Color,
    val backgroundBottom: Color,
    val surface: Color,
    val surfaceElevated: Color,
    val onSurface: Color,
    val onSurfaceMuted: Color,
    val accent: Color,
    val onAccent: Color,
    val boardBackground: Color,
    val cellEmpty: Color,
    val cellGrid: Color,
    val blockedCell: Color,
    val validGhost: Color,
    val invalidGhost: Color,
    val success: Color,
    val danger: Color,
    val gold: Color,
    val pieceColors: List<Color>,
    val pieceShadow: Color
) {
    val backgroundBrush: Brush
        get() = Brush.verticalGradient(listOf(backgroundTop, backgroundBottom))
}

private val turquoise = GamePalette(
    themeId = "turquoise",
    label = "فیروزه‌ای",
    dark = true,
    backgroundTop = Color(0xFF0A3D38),
    backgroundBottom = Color(0xFF04211F),
    surface = Color(0xFF0E4A44),
    surfaceElevated = Color(0xFF145C54),
    onSurface = Color(0xFFF2FBF9),
    onSurfaceMuted = Color(0xFFB6D9D3),
    accent = Color(0xFF5EEAD4),
    onAccent = Color(0xFF04211F),
    boardBackground = Color(0xFF08332F),
    cellEmpty = Color(0xFF0C423C),
    cellGrid = Color(0xFF1C635B),
    blockedCell = Color(0xFF2F6F67),
    validGhost = Color(0x995EEAD4),
    invalidGhost = Color(0x99FB7185),
    success = Color(0xFF34D399),
    danger = Color(0xFFFB7185),
    gold = Color(0xFFFACC15),
    pieceColors = listOf(
        Color(0xFF5EEAD4),
        Color(0xFF60A5FA),
        Color(0xFFFACC15),
        Color(0xFFFB7185),
        Color(0xFFC084FC)
    ),
    pieceShadow = Color(0x66000000)
)

private val purpleNight = GamePalette(
    themeId = "purple_night",
    label = "شب بنفش",
    dark = true,
    backgroundTop = Color(0xFF2B1163),
    backgroundBottom = Color(0xFF120726),
    surface = Color(0xFF35206E),
    surfaceElevated = Color(0xFF442C86),
    onSurface = Color(0xFFF6F0FF),
    onSurfaceMuted = Color(0xFFCDBDF0),
    accent = Color(0xFFC084FC),
    onAccent = Color(0xFF1B0A3A),
    boardBackground = Color(0xFF1D0F3D),
    cellEmpty = Color(0xFF291552),
    cellGrid = Color(0xFF4B3482),
    blockedCell = Color(0xFF5B4A88),
    validGhost = Color(0x99C084FC),
    invalidGhost = Color(0x99FB7185),
    success = Color(0xFF6EE7B7),
    danger = Color(0xFFFB7185),
    gold = Color(0xFFFDE047),
    pieceColors = listOf(
        Color(0xFFC084FC),
        Color(0xFF7DD3FC),
        Color(0xFFFDE047),
        Color(0xFFFB7185),
        Color(0xFF5EEAD4)
    ),
    pieceShadow = Color(0x77000000)
)

private val sunny = GamePalette(
    themeId = "sunny",
    label = "آفتابی",
    dark = false,
    backgroundTop = Color(0xFFFFF4D6),
    backgroundBottom = Color(0xFFFFE3A3),
    surface = Color(0xFFFFFBF0),
    surfaceElevated = Color(0xFFFFFFFF),
    onSurface = Color(0xFF3B2A12),
    onSurfaceMuted = Color(0xFF7A653F),
    accent = Color(0xFFD97706),
    onAccent = Color(0xFFFFFBF0),
    boardBackground = Color(0xFFF6D98D),
    cellEmpty = Color(0xFFFBE9B7),
    cellGrid = Color(0xFFE0B95C),
    blockedCell = Color(0xFFC58F2E),
    validGhost = Color(0xAA0F766E),
    invalidGhost = Color(0xAAB91C1C),
    success = Color(0xFF047857),
    danger = Color(0xFFB91C1C),
    gold = Color(0xFFB45309),
    pieceColors = listOf(
        Color(0xFF0F766E),
        Color(0xFF1D4ED8),
        Color(0xFFB45309),
        Color(0xFFBE123C),
        Color(0xFF6D28D9)
    ),
    pieceShadow = Color(0x33000000)
)

private val minimalLight = GamePalette(
    themeId = "minimal_light",
    label = "روشن ساده",
    dark = false,
    backgroundTop = Color(0xFFF8FAFC),
    backgroundBottom = Color(0xFFE2E8F0),
    surface = Color(0xFFFFFFFF),
    surfaceElevated = Color(0xFFF1F5F9),
    onSurface = Color(0xFF0F172A),
    onSurfaceMuted = Color(0xFF475569),
    accent = Color(0xFF0F766E),
    onAccent = Color(0xFFFFFFFF),
    boardBackground = Color(0xFFE2E8F0),
    cellEmpty = Color(0xFFF8FAFC),
    cellGrid = Color(0xFFCBD5E1),
    blockedCell = Color(0xFF94A3B8),
    validGhost = Color(0x880F766E),
    invalidGhost = Color(0x88DC2626),
    success = Color(0xFF15803D),
    danger = Color(0xFFB91C1C),
    gold = Color(0xFFA16207),
    pieceColors = listOf(
        Color(0xFF0F766E),
        Color(0xFF1D4ED8),
        Color(0xFFA16207),
        Color(0xFFBE123C),
        Color(0xFF7E22CE)
    ),
    pieceShadow = Color(0x22000000)
)

object GameThemes {
    val all: List<GamePalette> = listOf(turquoise, purpleNight, sunny, minimalLight)
    fun byId(id: String): GamePalette = all.firstOrNull { it.themeId == id } ?: turquoise
}

val LocalGamePalette = staticCompositionLocalOf { turquoise }
val LocalReduceMotion = staticCompositionLocalOf { false }

private val Vazirmatn = FontFamily(
    Font(R.font.vazirmatn_regular, FontWeight.Normal),
    Font(R.font.vazirmatn_bold, FontWeight.Bold)
)

private fun typography(): Typography {
    val base = Typography()
    fun TextStyle.withFont() = copy(fontFamily = Vazirmatn)
    return Typography(
        displayLarge = base.displayLarge.withFont(),
        displayMedium = base.displayMedium.withFont(),
        displaySmall = base.displaySmall.withFont(),
        headlineLarge = base.headlineLarge.withFont(),
        headlineMedium = base.headlineMedium.withFont(),
        headlineSmall = base.headlineSmall.withFont(),
        titleLarge = base.titleLarge.withFont(),
        titleMedium = base.titleMedium.withFont(),
        titleSmall = base.titleSmall.withFont(),
        bodyLarge = base.bodyLarge.withFont(),
        bodyMedium = base.bodyMedium.withFont(),
        bodySmall = base.bodySmall.withFont(),
        labelLarge = base.labelLarge.withFont(),
        labelMedium = base.labelMedium.withFont(),
        labelSmall = base.labelSmall.withFont()
    )
}

@Composable
fun BlockestanTheme(
    themeId: String,
    reduceMotion: Boolean,
    content: @Composable () -> Unit
) {
    val palette = GameThemes.byId(themeId)
    val scheme = if (palette.dark) {
        darkColorScheme(
            primary = palette.accent,
            onPrimary = palette.onAccent,
            secondary = palette.gold,
            onSecondary = palette.onAccent,
            background = palette.backgroundBottom,
            onBackground = palette.onSurface,
            surface = palette.surface,
            onSurface = palette.onSurface,
            surfaceVariant = palette.surfaceElevated,
            onSurfaceVariant = palette.onSurfaceMuted,
            error = palette.danger
        )
    } else {
        lightColorScheme(
            primary = palette.accent,
            onPrimary = palette.onAccent,
            secondary = palette.gold,
            onSecondary = palette.onAccent,
            background = palette.backgroundTop,
            onBackground = palette.onSurface,
            surface = palette.surface,
            onSurface = palette.onSurface,
            surfaceVariant = palette.surfaceElevated,
            onSurfaceVariant = palette.onSurfaceMuted,
            error = palette.danger
        )
    }
    CompositionLocalProvider(
        LocalGamePalette provides palette,
        LocalReduceMotion provides reduceMotion,
        LocalLayoutDirection provides LayoutDirection.Rtl
    ) {
        MaterialTheme(
            colorScheme = scheme,
            typography = typography(),
            content = content
        )
    }
}

/** Persian-style numerals used everywhere in the UI. */
fun Int.fa(): String = toString().map { ch ->
    if (ch.isDigit()) '۰' + (ch - '0') else ch
}.joinToString("")

fun formatDuration(seconds: Long): String {
    val m = (seconds / 60).toInt()
    val s = (seconds % 60).toInt()
    return "${m.fa()}:${s.fa().padStart(2, '۰')}"
}
