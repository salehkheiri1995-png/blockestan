package ir.blockestan.game.core.generation

import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.GoalType
import ir.blockestan.game.core.model.LevelGoal
import ir.blockestan.game.core.model.Piece
import ir.blockestan.game.core.model.StarThresholds
import ir.blockestan.game.core.model.boardFromRows
import ir.blockestan.game.core.engine.ShapeCatalog
import kotlinx.serialization.Serializable

@Serializable
data class PieceSpec(
    val shape: String,
    /** 0 means: choose a deterministic palette color. */
    val color: Int = 0
)

@Serializable
data class ReferenceMove(
    val tray: Int,
    val slot: Int,
    val row: Int,
    val col: Int
)

/**
 * A campaign level is data-driven. Its tray sequence is explicit so the authoring tool can
 * prove a reference solution against the production engine. Colors never affect the rules.
 */
@Serializable
data class LevelDefinition(
    val id: Int,
    val title: String,
    val hint: String,
    val seed: Long,
    val initialBoard: List<String>,
    val targetCells: List<Int>,
    val goals: List<LevelGoal>,
    val moveLimit: Int,
    val trays: List<List<PieceSpec>>,
    val difficulty: Difficulty,
    val starThresholds: StarThresholds,
    val referenceSolution: List<ReferenceMove>
) {
    fun occupiedBoard(): List<Int> = boardFromRows(initialBoard)

    fun piecesForTray(trayIndex: Int): List<Piece> {
        val tray = trays.getOrNull(trayIndex) ?: error("Level $id has no tray $trayIndex")
        require(tray.size == 3) { "Level $id tray $trayIndex must have three pieces" }
        return tray.mapIndexed { slot, spec ->
            val shape = ShapeCatalog.byName(spec.shape)
            val color = if (spec.color in 1..5) spec.color else ShapeCatalog.paletteColor(shape, slot, trayIndex)
            Piece(shape, color)
        }
    }

    fun validateStatic(levelCount: Int) {
        require(id in 1..levelCount) { "Level id out of range: $id" }
        require(title.isNotBlank() && hint.isNotBlank()) { "Level $id needs title and hint" }
        require(initialBoard.size == 8 && initialBoard.all { it.length == 8 }) {
            "Level $id board must be 8x8"
        }
        require(initialBoard.all { row -> row.all { it == '.' || it == '#' } }) {
            "Level $id has an invalid board character"
        }
        require(targetCells.distinct().size == targetCells.size) { "Level $id has duplicate targets" }
        require(targetCells.all { it in 0..63 }) { "Level $id target out of bounds" }
        require(goals.isNotEmpty()) { "Level $id must have a goal" }
        require(goals.map { it.type }.distinct().size == goals.size) {
            "Level $id has duplicate goal types; combine them into one target"
        }
        require(moveLimit in 1..40) { "Level $id move limit is unrealistic" }
        require(trays.isNotEmpty() && trays.all { it.size == 3 }) { "Level $id trays must have 3 pieces" }
        require(trays.size <= 20) { "Level $id has too many authored trays" }
        require(trays.flatten().all { ShapeCatalog.byNameOrNull(it.shape) != null }) {
            "Level $id references an unknown shape"
        }
        require(referenceSolution.isNotEmpty()) { "Level $id has no reference solution" }
        require(referenceSolution.all { it.tray in 0 until trays.size }) {
            "Level $id reference points outside the authored trays"
        }
        require(referenceSolution.size <= moveLimit) { "Level $id reference needs more moves than allowed" }

        val targetGoal = goals.firstOrNull { it.type == GoalType.TARGET_CELLS }
        if (targetGoal != null) {
            require(targetGoal.target == targetCells.size) {
                "Level $id target goal must equal targetCells.size"
            }
        }
        val maxTargets = goals.firstOrNull { it.type == GoalType.TARGET_CELLS }?.target ?: 0
        require(maxTargets == 0 || targetCells.isNotEmpty())
    }
}

@Serializable
data class LevelCatalogFile(
    val formatVersion: Int,
    val generatorVersion: Int,
    val levels: List<LevelDefinition>
)
