package ir.blockestan.game.core.engine

import ir.blockestan.game.core.model.Difficulty

/**
 * Every tunable economy, scoring, ad-policy and difficulty number lives here.
 * Changing a value must not require touching UI code.
 */
object GameBalanceConfig {
    // Economy
    const val STARTING_COINS = 150
    const val FIRST_LEVEL_WIN_COINS = 30
    const val REWARDED_AD_COINS = 40
    const val UNDO_COST = 50
    const val SWAP_COST = 70
    const val HAMMER_COST = 90
    const val CONTINUE_COST = 100
    const val DAILY_REWARD_COINS = 20
    const val DAILY_REWARD_SCORE = 250

    // Skins (virtual coins only; no real-money purchase)
    const val THEME_TURQUOISE_PRICE = 0
    const val THEME_PURPLE_NIGHT_PRICE = 250
    const val THEME_SUNNY_PRICE = 350
    const val THEME_MINIMAL_LIGHT_PRICE = 450

    // Scoring
    const val POINTS_PER_PLACED_CELL = 5
    const val POINTS_PER_LINE = 100
    const val MULTI_LINE_BONUS_PER_EXTRA_LINE = 75
    const val COMBO_MULTIPLIER_STEP = 0.25
    const val MAX_COMBO = 8
    const val MAX_COMBO_MULTIPLIER = 2.0

    // Level campaign
    const val TOTAL_LEVELS = 60
    const val MAX_LEVEL_REFERENCE_MOVES = 16

    // Ads policy (product settings, not network rules)
    const val INTERSTITIAL_FIRST_RUNS_WITHOUT_ADS = 3
    const val INTERSTITIAL_MIN_INTERVAL_SECONDS = 180L
    const val INTERSTITIAL_EVERY_N_RUNS = 3
    const val INTERSTITIAL_AFTER_REWARDED_COOLDOWN_SECONDS = 120L

    // Daily challenge algorithm version. Bump only with a migration note.
    const val DAILY_ALGORITHM_VERSION = 1

    val shapeWeights: Map<Difficulty, Map<String, Int>> = mapOf(
        Difficulty.EASY to mapOf(
            Shapes.SINGLE.name to 18,
            Shapes.DOMINO_H.name to 16,
            Shapes.DOMINO_V.name to 16,
            Shapes.LINE3_H.name to 12,
            Shapes.LINE3_V.name to 12,
            Shapes.SQUARE2.name to 12,
            Shapes.L3_A.name to 8,
            Shapes.L3_B.name to 8,
            Shapes.L3_C.name to 8,
            Shapes.L3_D.name to 8,
            Shapes.LINE4_H.name to 5,
            Shapes.LINE4_V.name to 5,
            Shapes.RECT2X3.name to 4,
            Shapes.RECT3X2.name to 4,
            Shapes.L4_A.name to 2,
            Shapes.L4_B.name to 2,
            Shapes.L4_C.name to 2,
            Shapes.L4_D.name to 2,
            Shapes.T4_UP.name to 2,
            Shapes.T4_DOWN.name to 2,
            Shapes.T4_LEFT.name to 2,
            Shapes.T4_RIGHT.name to 2
        ),
        Difficulty.NORMAL to mapOf(
            Shapes.SINGLE.name to 7,
            Shapes.DOMINO_H.name to 11,
            Shapes.DOMINO_V.name to 11,
            Shapes.LINE3_H.name to 11,
            Shapes.LINE3_V.name to 11,
            Shapes.SQUARE2.name to 10,
            Shapes.L3_A.name to 7,
            Shapes.L3_B.name to 7,
            Shapes.L3_C.name to 7,
            Shapes.L3_D.name to 7,
            Shapes.LINE4_H.name to 9,
            Shapes.LINE4_V.name to 9,
            Shapes.RECT2X3.name to 7,
            Shapes.RECT3X2.name to 7,
            Shapes.L4_A.name to 6,
            Shapes.L4_B.name to 6,
            Shapes.L4_C.name to 6,
            Shapes.L4_D.name to 6,
            Shapes.T4_UP.name to 5,
            Shapes.T4_DOWN.name to 5,
            Shapes.T4_LEFT.name to 5,
            Shapes.T4_RIGHT.name to 5,
            Shapes.S4.name to 4,
            Shapes.Z4.name to 4
        ),
        Difficulty.HARD to mapOf(
            Shapes.SINGLE.name to 2,
            Shapes.DOMINO_H.name to 5,
            Shapes.DOMINO_V.name to 5,
            Shapes.LINE3_H.name to 8,
            Shapes.LINE3_V.name to 8,
            Shapes.SQUARE2.name to 8,
            Shapes.L3_A.name to 6,
            Shapes.L3_B.name to 6,
            Shapes.L3_C.name to 6,
            Shapes.L3_D.name to 6,
            Shapes.LINE4_H.name to 11,
            Shapes.LINE4_V.name to 11,
            Shapes.RECT2X3.name to 9,
            Shapes.RECT3X2.name to 9,
            Shapes.L4_A.name to 8,
            Shapes.L4_B.name to 8,
            Shapes.L4_C.name to 8,
            Shapes.L4_D.name to 8,
            Shapes.T4_UP.name to 8,
            Shapes.T4_DOWN.name to 8,
            Shapes.T4_LEFT.name to 8,
            Shapes.T4_RIGHT.name to 8,
            Shapes.S4.name to 5,
            Shapes.Z4.name to 5
        )
    )

    fun themePrice(themeId: String): Int = when (themeId) {
        "turquoise" -> THEME_TURQUOISE_PRICE
        "purple_night" -> THEME_PURPLE_NIGHT_PRICE
        "sunny" -> THEME_SUNNY_PRICE
        "minimal_light" -> THEME_MINIMAL_LIGHT_PRICE
        else -> error("Unknown theme '$themeId'")
    }

    fun isValidTheme(themeId: String): Boolean = themeId in setOf(
        "turquoise", "purple_night", "sunny", "minimal_light"
    )
}
