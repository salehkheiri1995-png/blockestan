package ir.blockestan.game.core.engine

import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.Piece
import ir.blockestan.game.core.model.PieceShape

class PieceGenerator(
    private val weights: Map<Difficulty, List<Pair<PieceShape, Int>>> = buildWeights()
) {
    fun generateTray(
        rng: DeterministicRandom,
        difficulty: Difficulty
    ): List<Piece> = List(3) {
        val shape = pickShape(rng, difficulty)
        Piece(shape, rng.nextInt(5) + 1)
    }

    fun randomPiece(rng: DeterministicRandom, difficulty: Difficulty): Piece =
        Piece(pickShape(rng, difficulty), rng.nextInt(5) + 1)

    fun pickShape(rng: DeterministicRandom, difficulty: Difficulty): PieceShape {
        val pool = weights.getValue(difficulty)
        val total = pool.sumOf { it.second }
        var roll = rng.nextInt(total)
        for ((shape, weight) in pool) {
            if (roll < weight) return shape
            roll -= weight
        }
        return pool.last().first
    }

    companion object {
        fun buildWeights(): Map<Difficulty, List<Pair<PieceShape, Int>>> =
            Difficulty.entries.associateWith { difficulty ->
                val configured = GameBalanceConfig.shapeWeights.getValue(difficulty)
                ShapeCatalog.all.mapNotNull { shape ->
                    val weight = configured[shape.name] ?: 0
                    if (weight > 0) shape to weight else null
                }.also { require(it.isNotEmpty()) { "Empty shape pool for $difficulty" } }
            }
    }
}
