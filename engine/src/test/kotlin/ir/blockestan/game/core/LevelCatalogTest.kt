package ir.blockestan.game.core

import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.generation.LevelCatalog
import ir.blockestan.game.core.generation.LevelValidator
import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.cellsInFullLines
import ir.blockestan.game.core.model.hasMove
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LevelCatalogTest {

    @Test
    fun the_catalog_contains_exactly_sixty_well_formed_levels() {
        val levels = LevelCatalog.levels
        assertEquals(GameBalanceConfig.TOTAL_LEVELS, levels.size)
        assertEquals((1..60).toList(), levels.map { it.id })
        assertEquals(60, levels.map { it.title }.distinct().size)
        levels.forEach { level ->
            assertTrue(level.title.isNotBlank())
            assertTrue(level.hint.isNotBlank())
            assertTrue(level.moveLimit <= 40)
            assertTrue(level.referenceSolution.size <= 16)
            assertTrue(cellsInFullLines(level.occupiedBoard()).isEmpty())
        }
    }

    @Test
    fun difficulty_progression_covers_easy_normal_and_hard() {
        val levels = LevelCatalog.levels
        assertEquals(15, levels.count { it.difficulty == Difficulty.EASY })
        assertEquals(25, levels.count { it.difficulty == Difficulty.NORMAL })
        assertEquals(20, levels.count { it.difficulty == Difficulty.HARD })
    }

    @Test
    fun every_reference_solution_replays_to_a_win() {
        val results = LevelValidator.validateAll(LevelCatalog.levels)
        assertEquals(60, results.size)
        results.forEach { result ->
            assertTrue("Level ${result.levelId} did not win", result.won)
            assertTrue("Level ${result.levelId} used too many moves", result.moves <= 16)
            assertTrue("Level ${result.levelId} scored nothing", result.score > 0)
            assertEquals("Level ${result.levelId} left targets", 0, result.remainingTargets)
            assertTrue(result.stars in 1..3)
        }
    }

    @Test
    fun a_fresh_level_session_opens_with_a_legal_move() {
        LevelCatalog.levels.forEach { level ->
            val session = GameSession.newLevel(level)
            assertEquals(RunStatus.PLAYING, session.state.status)
            assertTrue("Level ${level.id} opens dead", session.state.hasMove())
            assertEquals(3, session.state.tray.size)
            assertNotNull(level.hint)
        }
    }

    @Test
    fun level_goals_are_reachable_by_the_reference_but_not_met_at_the_opening() {
        LevelCatalog.levels.forEach { level ->
            val session = GameSession.newLevel(level)
            assertEquals(0, session.state.score)
            val met = level.goals.all { goal ->
                when (goal.type) {
                    ir.blockestan.game.core.model.GoalType.SCORE -> session.state.score >= goal.target
                    ir.blockestan.game.core.model.GoalType.LINES ->
                        session.state.linesCleared >= goal.target
                    ir.blockestan.game.core.model.GoalType.TARGET_CELLS ->
                        level.targetCells.size - session.state.remainingTargets.size >= goal.target
                }
            }
            assertTrue("Level ${level.id} starts already won", !met)
        }
    }

    @Test
    fun level_session_rejects_an_illegal_reference_prefix() {
        val level = LevelCatalog.byId(1)!!
        val session = GameSession.newLevel(level)
        val outcome = session.place(0, -1, 0)
        assertTrue(outcome is PlacementOutcome.Invalid)
    }
}
