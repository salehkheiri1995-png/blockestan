package ir.blockestan.game.core.persistence

import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.GameState
import kotlinx.serialization.Serializable

@Serializable
enum class CoinReason {
    START,
    LEVEL_FIRST_WIN,
    DAILY_REWARD,
    REWARDED_AD,
    THEME_PURCHASE,
    UNDO,
    SWAP,
    HAMMER,
    CONTINUE,
    ADJUST
}

@Serializable
data class CoinTransaction(
    val id: String,
    val reason: CoinReason,
    val amount: Int,
    val atEpochMs: Long,
    val requestId: String? = null
)

@Serializable
data class StatsSave(
    val runsFinished: Int = 0,
    val classicRuns: Int = 0,
    val levelWins: Int = 0,
    val rewardedShows: Int = 0
)

@Serializable
data class DailySave(
    val dayKey: String = "",
    val bestScore: Int = 0,
    val rewardClaimed: Boolean = false
)

@Serializable
data class ActiveRunSave(
    val mode: GameMode,
    val levelId: Int?,
    val dayKey: String?,
    val state: GameState
)

@Serializable
data class AppSaveData(
    val formatVersion: Int = SaveFormat.CURRENT,
    val coins: Int = GameBalanceConfig.STARTING_COINS,
    val ownedThemes: Set<String> = setOf("turquoise"),
    val selectedTheme: String = "turquoise",
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val reduceMotion: Boolean = false,
    val personalizedAdsConsent: Boolean = false,
    val onboardingDone: Boolean = false,
    val unlockedLevel: Int = 1,
    val levelStars: Map<Int, Int> = emptyMap(),
    val firstWinClaimed: Set<Int> = emptySet(),
    val classicBest: Int = 0,
    val daily: DailySave = DailySave(),
    val activeRun: ActiveRunSave? = null,
    val stats: StatsSave = StatsSave(),
    val transactions: List<CoinTransaction> = emptyList(),
    val grantedAdRewardIds: List<String> = emptyList(),
    /** Epoch millis of the last interstitial impression, used by the ad frequency policy. */
    val lastInterstitialAtMs: Long = 0,
    /** Epoch millis of the last rewarded reward, used to avoid an interstitial right after it. */
    val lastRewardedAtMs: Long = 0,
    /**
     * Every economy mutation records its caller-supplied request id here before it is
     * committed. Replaying the same request (double tap, re-delivered SDK callback,
     * process restore) is a no-op instead of a second reward or charge.
     */
    val appliedRequestIds: List<String> = emptyList()
) {
    fun sanitized(): AppSaveData = copy(
        coins = coins.coerceAtLeast(0),
        ownedThemes = ownedThemes + "turquoise",
        selectedTheme = selectedTheme.takeIf { GameBalanceConfig.isValidTheme(it) } ?: "turquoise",
        unlockedLevel = unlockedLevel.coerceIn(1, GameBalanceConfig.TOTAL_LEVELS),
        levelStars = levelStars.filterKeys { it in 1..GameBalanceConfig.TOTAL_LEVELS }
            .mapValues { it.value.coerceIn(0, 3) },
        firstWinClaimed = firstWinClaimed.filter { it in 1..GameBalanceConfig.TOTAL_LEVELS }.toSet(),
        classicBest = classicBest.coerceAtLeast(0),
        daily = daily.copy(bestScore = daily.bestScore.coerceAtLeast(0)),
        stats = stats.copy(
            runsFinished = stats.runsFinished.coerceAtLeast(0),
            classicRuns = stats.classicRuns.coerceAtLeast(0),
            levelWins = stats.levelWins.coerceAtLeast(0),
            rewardedShows = stats.rewardedShows.coerceAtLeast(0)
        ),
        transactions = transactions.takeLast(MAX_AUDIT_ROWS),
        grantedAdRewardIds = grantedAdRewardIds.takeLast(MAX_GRANTED_IDS),
        appliedRequestIds = appliedRequestIds.distinct().takeLast(MAX_APPLIED_IDS)
    )
    companion object {
        const val MAX_AUDIT_ROWS = 40
        const val MAX_GRANTED_IDS = 80
        const val MAX_APPLIED_IDS = 160
    }
}
