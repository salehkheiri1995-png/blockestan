package ir.blockestan.game.core.model

import kotlinx.serialization.Serializable

@Serializable
enum class GameMode { CLASSIC, LEVEL, DAILY }

@Serializable
enum class RunStatus { PLAYING, WON, LOST }

@Serializable
enum class Difficulty { EASY, NORMAL, HARD }

@Serializable
enum class GoalType { SCORE, LINES, TARGET_CELLS }

@Serializable
data class LevelGoal(
    val type: GoalType,
    val target: Int
) {
    init {
        require(target > 0) { "Goal target must be positive" }
    }
}

@Serializable
data class StarThresholds(
    val twoStars: Int,
    val threeStars: Int
) {
    init {
        require(twoStars > 0) { "Two-star threshold must be positive" }
        require(threeStars >= twoStars) { "Three-star threshold must not be below two-star threshold" }
    }
}

/**
 * A complete, immutable snapshot of an active run. It is serializable so a process death
 * cannot destroy the current board, tray, RNG position or undo information.
 */
@Serializable
data class GameState(
    val board: List<Int>,
    val remainingTargets: List<Int>,
    val tray: List<Piece?>,
    val trayIndex: Int,
    val score: Int,
    val combo: Int,
    val linesCleared: Int,
    val movesUsed: Int,
    val status: RunStatus,
    val rngState: Long,
    val seed: Long,
    val undo: UndoSnapshot? = null,
    val continueUsed: Boolean = false,
    val lastCleared: List<Int> = emptyList(),
    val lastLines: Int = 0,
    val lastGain: Int = 0
) {
    init {
        require(board.size == CELL_COUNT) { "Board must contain $CELL_COUNT cells" }
        require(tray.size == 3) { "Tray must contain exactly three slots" }
        require(remainingTargets.all(::inBounds)) { "Target cells must be in bounds" }
        require(score >= 0 && movesUsed >= 0 && combo >= 0 && linesCleared >= 0)
    }
}

@Serializable
data class UndoSnapshot(
    val board: List<Int>,
    val remainingTargets: List<Int>,
    val tray: List<Piece?>,
    val trayIndex: Int,
    val score: Int,
    val combo: Int,
    val linesCleared: Int,
    val movesUsed: Int,
    val status: RunStatus,
    val rngState: Long,
    val continueUsed: Boolean
) {
    fun toState(seed: Long): GameState = GameState(
        board = board,
        remainingTargets = remainingTargets,
        tray = tray,
        trayIndex = trayIndex,
        score = score,
        combo = combo,
        linesCleared = linesCleared,
        movesUsed = movesUsed,
        status = status,
        rngState = rngState,
        seed = seed,
        undo = null,
        continueUsed = continueUsed,
        lastCleared = emptyList(),
        lastLines = 0,
        lastGain = 0
    )
}

fun GameState.toUndoSnapshot(): UndoSnapshot = UndoSnapshot(
    board = board,
    remainingTargets = remainingTargets,
    tray = tray,
    trayIndex = trayIndex,
    score = score,
    combo = combo,
    linesCleared = linesCleared,
    movesUsed = movesUsed,
    status = status,
    rngState = rngState,
    continueUsed = continueUsed
)

sealed interface PlacementOutcome {
    data class Invalid(val reason: PlacementError) : PlacementOutcome
    data class Success(
        val gainedScore: Int,
        val placedCells: Int,
        val clearedCells: List<Int>,
        val clearedRows: List<Int>,
        val clearedColumns: List<Int>,
        val lines: Int,
        val combo: Int,
        val status: RunStatus
    ) : PlacementOutcome
}

enum class PlacementError {
    NOT_PLAYING,
    EMPTY_SLOT,
    OUT_OF_BOUNDS,
    OVERLAP,
    NO_LEGAL_MOVE
}

data class RescuePlan(
    val centerRow: Int,
    val centerCol: Int,
    val clearedCells: List<Int>
)

sealed interface BoosterOutcome {
    data class Applied(val clearedCells: List<Int> = emptyList()) : BoosterOutcome
    data object NotApplicable : BoosterOutcome
    data class Rejected(val reason: String) : BoosterOutcome
}

fun GameState.hasMove(): Boolean {
    if (status != RunStatus.PLAYING) return false
    tray.forEach { piece ->
        if (piece != null && canPieceFit(board, piece.shape)) return true
    }
    return false
}

fun canPieceFit(board: List<Int>, shape: PieceShape): Boolean {
    val maxRow = BOARD_SIZE - shape.height
    val maxCol = BOARD_SIZE - shape.width
    if (maxRow < 0 || maxCol < 0) return false
    for (row in 0..maxRow) {
        for (col in 0..maxCol) {
            if (shape.cells.all { cell -> board[indexOf(row + cell.row, col + cell.col)] == 0 }) {
                return true
            }
        }
    }
    return false
}

fun GameState.goalProgress(goals: List<LevelGoal>, totalTargets: Int): List<Float> = goals.map { goal ->
    when (goal.type) {
        GoalType.SCORE -> score.toFloat() / goal.target
        GoalType.LINES -> linesCleared.toFloat() / goal.target
        GoalType.TARGET_CELLS -> {
            val cleared = (totalTargets - remainingTargets.size).coerceAtLeast(0)
            cleared.toFloat() / goal.target
        }
    }
}.map { it.coerceIn(0f, 1f) }

fun GameState.areGoalsMet(goals: List<LevelGoal>, totalTargets: Int): Boolean = goals.all { goal ->
    when (goal.type) {
        GoalType.SCORE -> score >= goal.target
        GoalType.LINES -> linesCleared >= goal.target
        GoalType.TARGET_CELLS -> (totalTargets - remainingTargets.size) >= goal.target
    }
}
