package ir.blockestan.game.core.generation

import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.cellsInFullLines
import ir.blockestan.game.core.model.hasMove

data class ReplayResult(
    val levelId: Int,
    val won: Boolean,
    val moves: Int,
    val score: Int,
    val lines: Int,
    val stars: Int,
    val remainingTargets: Int
)

object LevelValidator {
    fun replay(level: LevelDefinition): ReplayResult {
        level.validateStatic(60)
        val initialBoard = level.occupiedBoard()
        require(cellsInFullLines(initialBoard).isEmpty()) {
            "Level ${level.id} starts with a completed line"
        }
        val session = GameSession.newLevel(level)
        require(session.state.status == RunStatus.PLAYING) {
            "Level ${level.id} has no legal opening move"
        }
        require(session.state.hasMove()) { "Level ${level.id} opening tray is unusable" }

        level.referenceSolution.forEachIndexed { index, move ->
            require(session.currentTrayNumber == move.tray) {
                "Level ${level.id}: reference move $index expects tray ${move.tray}, " +
                    "engine is at ${session.currentTrayNumber}"
            }
            val outcome = session.place(move.slot, move.row, move.col)
            require(outcome is PlacementOutcome.Success) {
                "Level ${level.id}: reference move $index is illegal: $outcome"
            }
            require(session.state.status != RunStatus.WON || index == level.referenceSolution.lastIndex) {
                "Level ${level.id}: reference solution continues after winning"
            }
        }

        val state = session.state
        require(state.status == RunStatus.WON) {
            "Level ${level.id}: reference replay ended as ${state.status}, score=${state.score}, " +
                "lines=${state.linesCleared}, targets=${state.remainingTargets.size}"
        }
        require(state.movesUsed <= level.moveLimit) {
            "Level ${level.id}: replay used ${state.movesUsed} moves, limit is ${level.moveLimit}"
        }

        val stars = when {
            state.score >= level.starThresholds.threeStars -> 3
            state.score >= level.starThresholds.twoStars -> 2
            else -> 1
        }
        return ReplayResult(
            levelId = level.id,
            won = true,
            moves = state.movesUsed,
            score = state.score,
            lines = state.linesCleared,
            stars = stars,
            remainingTargets = state.remainingTargets.size
        )
    }

    fun validateAll(levels: List<LevelDefinition>): List<ReplayResult> {
        val results = levels.map(::replay)
        require(results.all { it.won }) { "A level failed reference replay" }
        return results
    }
}
