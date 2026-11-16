package ir.blockestan.game.game

import androidx.compose.ui.geometry.Offset
import ir.blockestan.game.core.generation.LevelDefinition
import ir.blockestan.game.core.model.Cell
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.GameState
import ir.blockestan.game.core.model.PieceShape
import ir.blockestan.game.core.model.RescuePlan
import ir.blockestan.game.core.persistence.AppSaveData

enum class Screen {
    HOME, LEVELS, GAME, SHOP, SETTINGS, PRIVACY
}

enum class RewardPurpose {
    COINS, CONTINUE
}

data class DragUi(
    val slot: Int,
    val shape: PieceShape,
    val color: Int,
    /** Pointer position in the game root coordinate space. */
    val pointer: Offset,
    /** Cell inside the piece that was grabbed, so the piece follows the finger naturally. */
    val grabCell: Cell,
    val targetRow: Int,
    val targetCol: Int,
    val valid: Boolean
)

data class ResultUi(
    val mode: GameMode,
    val won: Boolean,
    val score: Int,
    val lines: Int,
    val stars: Int,
    val coinsEarned: Int,
    val newPersonalBest: Boolean,
    val levelId: Int?,
    val canContinue: Boolean,
    val dailyReward: Boolean,
    val nextLevelAvailable: Boolean
)

data class AdUi(
    val showing: Boolean = false,
    val simulated: Boolean = false,
    val purpose: RewardPurpose? = null,
    val message: String? = null
)

data class GameUiState(
    val save: AppSaveData = AppSaveData(),
    val screen: Screen = Screen.HOME,
    val session: GameState? = null,
    val mode: GameMode? = null,
    val level: LevelDefinition? = null,
    val dayKey: String? = null,
    val inputLocked: Boolean = false,
    val drag: DragUi? = null,
    val hammerMode: Boolean = false,
    val result: ResultUi? = null,
    val pendingRescue: RescuePlan? = null,
    val snack: String? = null,
    val ad: AdUi = AdUi(),
    val lastCleared: List<Int> = emptyList(),
    val adStatusLabel: String = "",
    val rewardedConfigured: Boolean = false,
    val rewardedSimulated: Boolean = false,
    val interstitialConfigured: Boolean = false
) {
    val levelId: Int? get() = level?.id
    val isPlaying: Boolean
        get() = session != null && !inputLocked && result == null &&
            session.status == ir.blockestan.game.core.model.RunStatus.PLAYING
}
