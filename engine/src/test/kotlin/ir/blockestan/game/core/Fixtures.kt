package ir.blockestan.game.core

import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.engine.ShapeCatalog
import ir.blockestan.game.core.generation.LevelDefinition
import ir.blockestan.game.core.generation.PieceSpec
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.CELL_COUNT
import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.GameState
import ir.blockestan.game.core.model.GoalType
import ir.blockestan.game.core.model.LevelGoal
import ir.blockestan.game.core.model.Piece
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.StarThresholds
import ir.blockestan.game.core.model.emptyBoard
import ir.blockestan.game.core.model.indexOf

object Fixtures {
    fun state(
        board: List<Int> = emptyBoard(),
        tray: List<Piece?> = listOf(null, null, null),
        trayIndex: Int = 1,
        score: Int = 0,
        combo: Int = 0,
        lines: Int = 0,
        moves: Int = 0,
        status: RunStatus = RunStatus.PLAYING,
        rngState: Long = 1L,
        seed: Long = 1L,
        targets: List<Int> = emptyList(),
        undo: ir.blockestan.game.core.model.UndoSnapshot? = null,
        continueUsed: Boolean = false
    ) = GameState(
        board = board,
        remainingTargets = targets,
        tray = tray,
        trayIndex = trayIndex,
        score = score,
        combo = combo,
        linesCleared = lines,
        movesUsed = moves,
        status = status,
        rngState = rngState,
        seed = seed,
        undo = undo,
        continueUsed = continueUsed
    )

    /** A board where every row and column keeps at least two holes, so no line is complete. */
    fun holedBoard(): List<Int> {
        val holes = setOf(
            indexOf(0, 0), indexOf(0, 1),
            indexOf(1, 0), indexOf(1, 5),
            indexOf(2, 2), indexOf(2, 6),
            indexOf(3, 3), indexOf(3, 7),
            indexOf(4, 4), indexOf(4, 0),
            indexOf(5, 5), indexOf(5, 1),
            indexOf(6, 6), indexOf(6, 2),
            indexOf(7, 7), indexOf(7, 3), indexOf(7, 6)
        )
        return List(CELL_COUNT) { if (it in holes) 0 else 1 }
    }

    fun filledRow(row: Int, except: Int): List<Int> {
        val board = MutableList(CELL_COUNT) { 0 }
        for (col in 0 until BOARD_SIZE) {
            if (col != except) board[indexOf(row, col)] = 1
        }
        return board
    }

    fun filledColumn(col: Int, except: Int): List<Int> {
        val board = MutableList(CELL_COUNT) { 0 }
        for (row in 0 until BOARD_SIZE) {
            if (row != except) board[indexOf(row, col)] = 1
        }
        return board
    }

    fun level(
        id: Int,
        trays: List<List<String>>,
        board: List<String> = List(BOARD_SIZE) { ".".repeat(BOARD_SIZE) },
        targets: List<Int> = emptyList(),
        scoreGoal: Int = 1_000_000,
        moveLimit: Int = 20
    ): LevelDefinition = LevelDefinition(
        id = id,
        title = "test-$id",
        hint = "test",
        seed = id.toLong() * 31,
        initialBoard = board,
        targetCells = targets,
        goals = listOf(LevelGoal(GoalType.SCORE, scoreGoal)),
        moveLimit = moveLimit,
        trays = trays.map { tray -> tray.map { PieceSpec(it, 1) } },
        difficulty = Difficulty.NORMAL,
        starThresholds = StarThresholds(10, 20),
        referenceSolution = emptyList()
    )

    fun piece(name: String, color: Int = 1): Piece = Piece(ShapeCatalog.byName(name), color)

    fun levelSession(level: LevelDefinition, state: GameState): GameSession =
        GameSession.restore(GameMode.LEVEL, level, state)

    fun classicSession(state: GameState): GameSession =
        GameSession.restore(GameMode.CLASSIC, null, state)
}
