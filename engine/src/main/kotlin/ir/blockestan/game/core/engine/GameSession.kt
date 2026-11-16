package ir.blockestan.game.core.engine

import ir.blockestan.game.core.generation.LevelDefinition
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.BoosterOutcome
import ir.blockestan.game.core.model.CELL_COUNT
import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.GameState
import ir.blockestan.game.core.model.GoalType
import ir.blockestan.game.core.model.Piece
import ir.blockestan.game.core.model.PlacementError
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RescuePlan
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.areGoalsMet
import ir.blockestan.game.core.model.canPieceFit
import ir.blockestan.game.core.model.cellsInFullLines
import ir.blockestan.game.core.model.colOf
import ir.blockestan.game.core.model.emptyBoard
import ir.blockestan.game.core.model.fullColumnIndices
import ir.blockestan.game.core.model.fullRowIndices
import ir.blockestan.game.core.model.goalProgress
import ir.blockestan.game.core.model.hasMove
import ir.blockestan.game.core.model.indexOf
import ir.blockestan.game.core.model.inBounds
import ir.blockestan.game.core.model.rowOf
import ir.blockestan.game.core.model.toUndoSnapshot
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Pure game session. It has no Android or Compose dependency and owns the complete,
 * serializable state of one run. All public mutators are synchronous and small.
 */
class GameSession private constructor(
    val mode: GameMode,
    val level: LevelDefinition?,
    initial: GameState,
    private val generator: PieceGenerator = PieceGenerator()
) {
    private var current: GameState = initial

    init {
        require(mode != GameMode.LEVEL || level != null) { "Level mode requires a level definition" }
        require(mode == GameMode.LEVEL || level == null) { "Only level mode accepts a level definition" }
    }

    val state: GameState get() = current
    val currentTrayNumber: Int get() = (current.trayIndex - 1).coerceAtLeast(0)

    fun goalProgress(): List<Float> =
        level?.let { current.goalProgress(it.goals, it.targetCells.size) } ?: emptyList()

    fun canPlace(slot: Int, row: Int, col: Int): Boolean {
        if (current.status != RunStatus.PLAYING) return false
        val piece = current.tray.getOrNull(slot) ?: return false
        if (!inBounds(row, col)) return false
        return piece.shape.cells.all { cell ->
            val r = row + cell.row
            val c = col + cell.col
            inBounds(r, c) && current.board[indexOf(r, c)] == 0
        }
    }

    fun place(slot: Int, row: Int, col: Int): PlacementOutcome {
        val before = current
        if (before.status != RunStatus.PLAYING) return PlacementOutcome.Invalid(PlacementError.NOT_PLAYING)
        val piece = before.tray.getOrNull(slot)
            ?: return PlacementOutcome.Invalid(PlacementError.EMPTY_SLOT)

        if (piece.shape.cells.any { !inBounds(row + it.row, col + it.col) }) {
            return PlacementOutcome.Invalid(PlacementError.OUT_OF_BOUNDS)
        }
        if (piece.shape.cells.any { before.board[indexOf(row + it.row, col + it.col)] != 0 }) {
            return PlacementOutcome.Invalid(PlacementError.OVERLAP)
        }

        val snapshot = before.toUndoSnapshot()
        val board = before.board.toMutableList()
        piece.shape.cells.forEach { cell ->
            board[indexOf(row + cell.row, col + cell.col)] = piece.color
        }

        val clearedRows = fullRowIndices(board)
        val clearedColumns = fullColumnIndices(board)
        val cleared = cellsInFullLines(board).toList()
        val lines = clearedRows.size + clearedColumns.size

        val newCombo = if (lines > 0) min(before.combo + 1, GameBalanceConfig.MAX_COMBO) else 0
        val multiplier = if (lines > 0) {
            min(
                GameBalanceConfig.MAX_COMBO_MULTIPLIER,
                1.0 + (newCombo - 1) * GameBalanceConfig.COMBO_MULTIPLIER_STEP
            )
        } else {
            1.0
        }
        val linePoints = lines * GameBalanceConfig.POINTS_PER_LINE +
            (lines - 1).coerceAtLeast(0) * GameBalanceConfig.MULTI_LINE_BONUS_PER_EXTRA_LINE
        val gain = piece.shape.size * GameBalanceConfig.POINTS_PER_PLACED_CELL +
            (linePoints * multiplier).roundToInt()

        cleared.forEach { board[it] = 0 }

        val remainingTargets = before.remainingTargets.filterNot { it in cleared }
        var tray = before.tray.toMutableList().also { it[slot] = null }
        var trayIndex = before.trayIndex
        var rng = DeterministicRandom(before.rngState)
        val movesUsed = before.movesUsed + 1

        val goalsMet = level?.let { definition ->
            definition.goals.all { goal ->
                when (goal.type) {
                    GoalType.SCORE -> before.score + gain >= goal.target
                    GoalType.LINES -> before.linesCleared + lines >= goal.target
                    GoalType.TARGET_CELLS ->
                        definition.targetCells.size - remainingTargets.size >= goal.target
                }
            }
        } == true
        var status = when {
            goalsMet -> RunStatus.WON
            level != null && movesUsed >= level.moveLimit -> RunStatus.LOST
            else -> RunStatus.PLAYING
        }

        if (status == RunStatus.PLAYING && tray.all { it == null }) {
            val drawn = drawTray(trayIndex, rng)
            tray = drawn.first.toMutableList()
            trayIndex = drawn.second
        }

        if (status == RunStatus.PLAYING) {
            val candidate = before.copy(
                board = board,
                remainingTargets = remainingTargets,
                tray = tray,
                trayIndex = trayIndex,
                score = before.score + gain,
                combo = newCombo,
                linesCleared = before.linesCleared + lines,
                movesUsed = movesUsed,
                status = RunStatus.PLAYING,
                rngState = rng.state
            )
            if (!candidate.hasMove()) status = RunStatus.LOST
        }

        val next = before.copy(
            board = board,
            remainingTargets = remainingTargets,
            tray = tray,
            trayIndex = trayIndex,
            score = before.score + gain,
            combo = newCombo,
            linesCleared = before.linesCleared + lines,
            movesUsed = movesUsed,
            status = status,
            rngState = rng.state,
            undo = if (status == RunStatus.PLAYING) snapshot else null,
            lastCleared = cleared,
            lastLines = lines,
            lastGain = gain
        )
        current = next

        return PlacementOutcome.Success(
            gainedScore = gain,
            placedCells = piece.shape.size,
            clearedCells = cleared,
            clearedRows = clearedRows,
            clearedColumns = clearedColumns,
            lines = lines,
            combo = newCombo,
            status = status
        )
    }

    /** Restores the last normal placement once. Coins are owned outside the engine. */
    fun undo(): BoosterOutcome {
        val before = current
        if (before.status != RunStatus.PLAYING) return BoosterOutcome.NotApplicable
        val snapshot = before.undo ?: return BoosterOutcome.NotApplicable
        current = snapshot.toState(before.seed)
        return BoosterOutcome.Applied()
    }

    /**
     * Replaces only the unconsumed pieces of the current tray. If five attempts produce the
     * same gameplay shapes, nothing is committed so the caller must not charge coins.
     */
    fun swapUnusedPieces(): BoosterOutcome {
        val before = current
        if (before.status != RunStatus.PLAYING) return BoosterOutcome.NotApplicable
        val activeSlots = before.tray.indices.filter { before.tray[it] != null }
        if (activeSlots.isEmpty()) return BoosterOutcome.NotApplicable

        val difficulty = level?.difficulty ?: Difficulty.NORMAL
        val oldSignatures = activeSlots.map { before.tray[it]!!.shape.name }
        val rng = DeterministicRandom(before.rngState)

        repeat(5) {
            val candidate = before.tray.toMutableList()
            activeSlots.forEach { slot ->
                candidate[slot] = generator.randomPiece(rng, difficulty)
            }
            val newSignatures = activeSlots.map { candidate[it]!!.shape.name }
            if (newSignatures != oldSignatures) {
                current = before.copy(
                    tray = candidate,
                    rngState = rng.state,
                    undo = null,
                    lastCleared = emptyList(),
                    lastLines = 0,
                    lastGain = 0
                )
                return BoosterOutcome.Applied()
            }
        }
        return BoosterOutcome.NotApplicable
    }

    fun hammerRegion(centerRow: Int, centerCol: Int): List<Int> {
        if (!inBounds(centerRow, centerCol)) return emptyList()
        return buildList {
            for (row in (centerRow - 1)..(centerRow + 1)) {
                for (col in (centerCol - 1)..(centerCol + 1)) {
                    if (inBounds(row, col)) add(indexOf(row, col))
                }
            }
        }
    }

    /**
     * Clears occupied cells in a clipped 3x3. Target markers are not goals' occupancy and
     * are never erased by the hammer; they only leave when a completed line crosses them.
     */
    fun useHammer(centerRow: Int, centerCol: Int): BoosterOutcome {
        val before = current
        if (before.status != RunStatus.PLAYING) return BoosterOutcome.NotApplicable
        val region = hammerRegion(centerRow, centerCol)
        val occupied = region.filter { before.board[it] != 0 }
        if (occupied.isEmpty()) return BoosterOutcome.NotApplicable

        val board = before.board.toMutableList()
        occupied.forEach { board[it] = 0 }
        current = before.copy(
            board = board,
            undo = null,
            lastCleared = occupied,
            lastLines = 0,
            lastGain = 0
        )
        return BoosterOutcome.Applied(occupied)
    }

    /**
     * Finds a 3x3 rescue that provably creates at least one legal move. The caller must not
     * offer a paid/ad rescue when this returns null.
     */
    fun rescuePlan(): RescuePlan? {
        val before = current
        if (before.status != RunStatus.LOST || before.continueUsed) return null
        val pieces = before.tray.filterNotNull()
        if (pieces.isEmpty()) return null

        var best: RescuePlan? = null
        var bestScore = Int.MAX_VALUE
        for (centerRow in 0 until BOARD_SIZE) {
            for (centerCol in 0 until BOARD_SIZE) {
                val region = hammerRegion(centerRow, centerCol)
                val occupied = region.filter { before.board[it] != 0 }
                if (occupied.isEmpty()) continue
                val board = before.board.toMutableList()
                occupied.forEach { board[it] = 0 }
                if (pieces.none { canPieceFit(board, it.shape) }) continue
                val distance = abs(centerRow - 3) + abs(centerCol - 3)
                val score = occupied.size * 100 + distance
                if (score < bestScore) {
                    bestScore = score
                    best = RescuePlan(centerRow, centerCol, occupied)
                }
            }
        }
        return best
    }

    fun applyRescue(plan: RescuePlan): Boolean {
        val before = current
        if (before.status != RunStatus.LOST || before.continueUsed) return false
        val region = hammerRegion(plan.centerRow, plan.centerCol)
        val occupied = region.filter { before.board[it] != 0 }
        if (occupied.isEmpty() || occupied.toSet() != plan.clearedCells.toSet()) return false

        val board = before.board.toMutableList()
        occupied.forEach { board[it] = 0 }
        val candidate = before.copy(
            board = board,
            status = RunStatus.PLAYING,
            continueUsed = true,
            undo = null,
            lastCleared = occupied,
            lastLines = 0,
            lastGain = 0
        )
        if (!candidate.hasMove()) return false
        current = candidate
        return true
    }

    private fun drawTray(trayIndex: Int, rng: DeterministicRandom): Pair<List<Piece>, Int> {
        val level = level
        if (level != null && trayIndex < level.trays.size) {
            return level.piecesForTray(trayIndex) to trayIndex + 1
        }
        val difficulty = level?.difficulty ?: Difficulty.NORMAL
        return generator.generateTray(rng, difficulty) to trayIndex + 1
    }

    companion object {
        fun newClassic(seed: Long): GameSession =
            create(GameMode.CLASSIC, null, seed)

        fun newDaily(seed: Long): GameSession =
            create(GameMode.DAILY, null, seed)

        fun newLevel(level: LevelDefinition): GameSession =
            create(GameMode.LEVEL, level, level.seed)

        fun restore(mode: GameMode, level: LevelDefinition?, state: GameState): GameSession =
            GameSession(mode, level, state)

        private fun create(mode: GameMode, level: LevelDefinition?, seed: Long): GameSession {
            val generator = PieceGenerator()
            val rng = DeterministicRandom(seed)
            val board = level?.occupiedBoard() ?: emptyBoard()
            val targets = level?.targetCells?.sorted() ?: emptyList()
            val firstTray: List<Piece>
            val trayIndex: Int
            if (level != null) {
                require(level.trays.isNotEmpty()) { "Level must contain a tray" }
                firstTray = level.piecesForTray(0)
                trayIndex = 1
            } else {
                firstTray = generator.generateTray(rng, Difficulty.NORMAL)
                trayIndex = 1
            }
            var state = GameState(
                board = board,
                remainingTargets = targets,
                tray = firstTray,
                trayIndex = trayIndex,
                score = 0,
                combo = 0,
                linesCleared = 0,
                movesUsed = 0,
                status = RunStatus.PLAYING,
                rngState = rng.state,
                seed = seed
            )
            if (!state.hasMove()) {
                // Defensive only. Authored levels are validated, and an empty classic board
                // always accepts a piece.
                state = state.copy(status = RunStatus.LOST)
            }
            return GameSession(mode, level, state, generator)
        }
    }
}
