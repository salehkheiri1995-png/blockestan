package ir.blockestan.game.core.engine

/**
 * Small, serializable PRNG. The state is part of GameState so undo and process-death
 * restoration reproduce exactly the same future tray sequence.
 */
class DeterministicRandom(var state: Long) {
    fun nextLong(): Long {
        state += GOLDEN_GAMMA
        var z = state
        z = (z xor (z ushr 30)) * MIX_1
        z = (z xor (z ushr 27)) * MIX_2
        return z xor (z ushr 31)
    }

    fun nextInt(bound: Int): Int {
        require(bound > 0) { "bound must be positive" }
        return (nextLong().ushr(1) % bound.toLong()).toInt()
    }

    /** Uniform double in [0, 1). Used only by the offline level authoring tool. */
    fun nextDouble(): Double = nextLong().ushr(11).toDouble() / (1L shl 53).toDouble()

    companion object {
        private const val GOLDEN_GAMMA = -7046029254386353131L
        private const val MIX_1 = -4658895280553007687L
        private const val MIX_2 = -7723592293110705685L
    }
}
