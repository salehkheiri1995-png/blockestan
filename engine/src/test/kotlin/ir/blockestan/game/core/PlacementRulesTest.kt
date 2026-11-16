package ir.blockestan.game.core

import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.BoosterOutcome
import ir.blockestan.game.core.model.CELL_COUNT
import ir.blockestan.game.core.model.PlacementError
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RescuePlan
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.canPieceFit
import ir.blockestan.game.core.model.emptyBoard
import ir.blockestan.game.core.model.indexOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlacementRulesTest {

    @Test
    fun placing_piece_marks_cells_and_scores_five_per_cell() {
        val session = Fixtures.classicSession(
            Fixtures.state(tray = listOf(Fixtures.piece("square2"), null, null))
        )
        val outcome = session.place(0, 2, 3) as PlacementOutcome.Success
        assertEquals(4, outcome.placedCells)
        assertEquals(4 * GameBalanceConfig.POINTS_PER_PLACED_CELL, outcome.gainedScore)
        assertEquals(0, outcome.lines)
        assertEquals(1, session.state.board[indexOf(2, 3)])
        assertEquals(1, session.state.board[indexOf(3, 4)])
        assertEquals(20, session.state.score)
    }

    @Test
    fun placement_outside_the_board_is_rejected() {
        val session = Fixtures.classicSession(
            Fixtures.state(tray = listOf(Fixtures.piece("line3_h"), null, null))
        )
        val outcome = session.place(0, 0, 6)
        assertEquals(PlacementOutcome.Invalid(PlacementError.OUT_OF_BOUNDS), outcome)
        assertEquals(0, session.state.movesUsed)
        assertTrue(session.state.board.all { it == 0 })
    }

    @Test
    fun placement_on_an_occupied_cell_is_rejected() {
        val board = emptyBoard().toMutableList().also { it[indexOf(2, 2)] = 1 }
        val session = Fixtures.classicSession(
            Fixtures.state(board = board, tray = listOf(Fixtures.piece("single"), null, null))
        )
        val outcome = session.place(0, 2, 2)
        assertEquals(PlacementOutcome.Invalid(PlacementError.OVERLAP), outcome)
        assertEquals(0, session.state.movesUsed)
    }

    @Test
    fun empty_tray_slot_is_rejected() {
        val session = Fixtures.classicSession(
            Fixtures.state(tray = listOf(null, Fixtures.piece("single"), null))
        )
        val outcome = session.place(0, 0, 0)
        assertEquals(PlacementOutcome.Invalid(PlacementError.EMPTY_SLOT), outcome)
    }

    @Test
    fun completed_row_is_cleared_and_pays_line_points() {
        val board = Fixtures.filledRow(7, except = 7)
        val session = Fixtures.classicSession(
            Fixtures.state(board = board, tray = listOf(Fixtures.piece("single"), null, null))
        )
        val outcome = session.place(0, 7, 7) as PlacementOutcome.Success
        assertEquals(1, outcome.lines)
        assertEquals(listOf(7), outcome.clearedRows)
        assertEquals(8, outcome.clearedCells.size)
        assertEquals(5 + GameBalanceConfig.POINTS_PER_LINE, outcome.gainedScore)
        assertTrue(session.state.board.all { it == 0 })
        assertEquals(1, session.state.linesCleared)
    }

    @Test
    fun completed_column_is_cleared() {
        val board = Fixtures.filledColumn(0, except = 7)
        val session = Fixtures.classicSession(
            Fixtures.state(board = board, tray = listOf(Fixtures.piece("single"), null, null))
        )
        val outcome = session.place(0, 7, 0) as PlacementOutcome.Success
        assertEquals(1, outcome.lines)
        assertEquals(listOf(0), outcome.clearedColumns)
        assertEquals(8, outcome.clearedCells.size)
        assertTrue(session.state.board.all { it == 0 })
    }

    @Test
    fun shared_cell_of_row_and_column_is_counted_once() {
        val board = MutableList(CELL_COUNT) { 0 }
        for (i in 0 until 7) {
            board[indexOf(7, i)] = 1
            board[indexOf(i, 7)] = 1
        }
        val session = Fixtures.classicSession(
            Fixtures.state(board = board, tray = listOf(Fixtures.piece("single"), null, null))
        )
        val outcome = session.place(0, 7, 7) as PlacementOutcome.Success
        assertEquals(2, outcome.lines)
        assertEquals(listOf(7), outcome.clearedRows)
        assertEquals(listOf(7), outcome.clearedColumns)
        assertEquals(15, outcome.clearedCells.size)
        assertEquals(15, outcome.clearedCells.distinct().size)
        val expectedLinePoints = 2 * GameBalanceConfig.POINTS_PER_LINE +
            GameBalanceConfig.MULTI_LINE_BONUS_PER_EXTRA_LINE
        assertEquals(5 + expectedLinePoints, outcome.gainedScore)
    }

    @Test
    fun combo_multiplier_is_applied_and_capped() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                board = Fixtures.filledRow(3, except = 7),
                tray = listOf(Fixtures.piece("single"), null, null),
                combo = GameBalanceConfig.MAX_COMBO - 1
            )
        )
        val outcome = session.place(0, 3, 7) as PlacementOutcome.Success
        assertEquals(GameBalanceConfig.MAX_COMBO, outcome.combo)
        val expected = 5 + (GameBalanceConfig.POINTS_PER_LINE *
            GameBalanceConfig.MAX_COMBO_MULTIPLIER).toInt()
        assertEquals(expected, outcome.gainedScore)
        assertEquals(GameBalanceConfig.MAX_COMBO, session.state.combo)
    }

    @Test
    fun combo_resets_when_a_move_clears_no_line() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                tray = listOf(Fixtures.piece("single"), null, null),
                combo = 4
            )
        )
        val outcome = session.place(0, 0, 0) as PlacementOutcome.Success
        assertEquals(0, outcome.combo)
        assertEquals(5, outcome.gainedScore)
    }

    @Test
    fun game_over_is_only_declared_after_refill_and_with_actual_pieces() {
        // The placed piece was the last one in the tray, but the next authored tray fits.
        val level = Fixtures.level(
            id = 1,
            trays = listOf(
                listOf("single", "single", "single"),
                listOf("single", "single", "single")
            )
        )
        val session = Fixtures.levelSession(
            level,
            Fixtures.state(
                board = Fixtures.holedBoard(),
                tray = listOf(Fixtures.piece("single"), null, null),
                trayIndex = 1
            )
        )
        val outcome = session.place(0, 0, 0) as PlacementOutcome.Success
        assertEquals(RunStatus.PLAYING, outcome.status)
        assertEquals(2, session.state.trayIndex)
        assertTrue(session.state.tray.all { it != null })
    }

    @Test
    fun unresolved_tray_without_any_fitting_piece_ends_the_run() {
        val level = Fixtures.level(
            id = 2,
            trays = listOf(
                listOf("single", "single", "single"),
                listOf("rect3x2", "rect3x2", "rect3x2")
            )
        )
        val session = Fixtures.levelSession(
            level,
            Fixtures.state(
                board = Fixtures.holedBoard(),
                tray = listOf(Fixtures.piece("single"), null, null),
                trayIndex = 1
            )
        )
        val outcome = session.place(0, 0, 0) as PlacementOutcome.Success
        assertEquals(RunStatus.LOST, outcome.status)
        // The tray was refilled first; the loss is based on the real remaining pieces.
        assertTrue(session.state.tray.all { it != null })
        assertTrue(session.state.tray.none { canPieceFit(session.state.board, it!!.shape) })
    }

    @Test
    fun move_limit_loss_is_reported_after_the_move() {
        val level = Fixtures.level(
            id = 3,
            trays = listOf(listOf("single", "single", "single")),
            moveLimit = 1
        )
        val session = Fixtures.levelSession(
            level,
            Fixtures.state(tray = listOf(Fixtures.piece("single"), Fixtures.piece("single"), Fixtures.piece("single")))
        )
        val outcome = session.place(0, 0, 0) as PlacementOutcome.Success
        assertEquals(RunStatus.LOST, outcome.status)
        assertEquals(1, session.state.movesUsed)
    }

    @Test
    fun placing_after_the_run_ended_is_rejected() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                tray = listOf(Fixtures.piece("single"), null, null),
                status = RunStatus.LOST
            )
        )
        assertEquals(
            PlacementOutcome.Invalid(PlacementError.NOT_PLAYING),
            session.place(0, 0, 0)
        )
    }

    @Test
    fun deterministic_generator_reproduces_the_same_tray_for_the_same_seed() {
        val a = GameSession.newClassic(2024L)
        val b = GameSession.newClassic(2024L)
        assertEquals(
            a.state.tray.map { it?.shape?.name },
            b.state.tray.map { it?.shape?.name }
        )
        a.place(0, 0, 0)
        b.place(0, 0, 0)
        assertEquals(a.state.tray, b.state.tray)
        assertEquals(a.state.rngState, b.state.rngState)
    }

    @Test
    fun undo_restores_the_exact_pre_placement_state_once() {
        val session = GameSession.newClassic(99L)
        val before = session.state
        assertTrue(session.place(0, 0, 0) is PlacementOutcome.Success)
        val after = session.state
        assertTrue(after.board != before.board)
        val undone = session.undo()
        assertTrue(undone is BoosterOutcome.Applied)
        assertEquals(before.board, session.state.board)
        assertEquals(before.tray, session.state.tray)
        assertEquals(before.score, session.state.score)
        assertEquals(before.movesUsed, session.state.movesUsed)
        assertEquals(before.trayIndex, session.state.trayIndex)
        assertNull(session.state.undo)
        assertEquals(BoosterOutcome.NotApplicable, session.undo())
    }

    @Test
    fun swap_replaces_only_unconsumed_slots() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                tray = listOf(
                    Fixtures.piece("single", 1),
                    Fixtures.piece("domino_h", 2),
                    null
                ),
                rngState = 1234567L
            )
        )
        val outcome = session.swapUnusedPieces()
        assertTrue(outcome is BoosterOutcome.Applied)
        assertNotNull(session.state.tray[0])
        assertNotNull(session.state.tray[1])
        assertNull(session.state.tray[2])
    }

    @Test
    fun hammer_clears_a_clipped_3x3_and_keeps_targets() {
        val board = List(CELL_COUNT) { 2 }
        val session = Fixtures.classicSession(
            Fixtures.state(board = board, targets = listOf(indexOf(3, 3)), tray = listOf(null, null, null))
        )
        val region = session.hammerRegion(0, 0)
        assertEquals(4, region.size)
        val outcome = session.useHammer(0, 0) as BoosterOutcome.Applied
        assertEquals(4, outcome.clearedCells.size)
        assertTrue(session.state.board.take(2).all { it == 0 })
        assertEquals(2, session.state.board[indexOf(2, 0)])
        assertEquals(listOf(indexOf(3, 3)), session.state.remainingTargets)
    }

    @Test
    fun hammer_on_an_empty_region_is_not_applicable() {
        val session = Fixtures.classicSession(
            Fixtures.state(board = emptyBoard(), tray = listOf(null, null, null))
        )
        assertEquals(BoosterOutcome.NotApplicable, session.useHammer(3, 3))
    }

    @Test
    fun rescue_plan_exists_only_when_it_provably_restores_a_move() {
        val board = Fixtures.holedBoard()
        val session = Fixtures.classicSession(
            Fixtures.state(
                board = board,
                tray = listOf(
                    Fixtures.piece("rect3x2"),
                    Fixtures.piece("rect3x2"),
                    null
                ),
                status = RunStatus.LOST
            )
        )
        val plan = session.rescuePlan()
        assertNotNull(plan)
        assertTrue(plan!!.clearedCells.isNotEmpty())
        assertTrue(session.applyRescue(plan))
        assertEquals(RunStatus.PLAYING, session.state.status)
        assertTrue(session.state.continueUsed)
        assertNull(session.rescuePlan())
    }

    @Test
    fun rescue_rejects_a_plan_that_does_not_match_the_board() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                board = Fixtures.holedBoard(),
                tray = listOf(Fixtures.piece("rect3x2"), Fixtures.piece("single"), null),
                status = RunStatus.LOST
            )
        )
        assertFalse(session.applyRescue(RescuePlan(0, 0, emptyList())))
        assertEquals(RunStatus.LOST, session.state.status)
        assertFalse(session.state.continueUsed)
    }

    @Test
    fun no_rescue_is_offered_after_a_continue_was_used() {
        val session = Fixtures.classicSession(
            Fixtures.state(
                board = Fixtures.holedBoard(),
                tray = listOf(Fixtures.piece("rect3x2"), null, null),
                status = RunStatus.LOST,
                continueUsed = true
            )
        )
        assertNull(session.rescuePlan())
    }

    @Test
    fun board_and_piece_geometry_is_normalized() {
        assertEquals(8, BOARD_SIZE)
        assertEquals(64, CELL_COUNT)
        val shapes = listOf(
            "single", "domino_h", "domino_v", "line3_h", "line3_v", "line4_h", "line4_v",
            "square2", "rect2x3", "rect3x2", "l3_a", "l3_b", "l3_c", "l3_d",
            "l4_a", "l4_b", "l4_c", "l4_d", "t4_up", "t4_down", "t4_left", "t4_right",
            "s4", "z4"
        )
        shapes.forEach { name ->
            val shape = Fixtures.piece(name).shape
            assertEquals(0, shape.cells.minOf { it.row })
            assertEquals(0, shape.cells.minOf { it.col })
            assertTrue(shape.width <= BOARD_SIZE && shape.height <= BOARD_SIZE)
        }
    }
}
