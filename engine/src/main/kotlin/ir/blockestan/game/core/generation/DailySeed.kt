package ir.blockestan.game.core.generation

import ir.blockestan.game.core.engine.GameBalanceConfig

/**
 * Daily seed is deliberately server-free. It is stable for a calendar day in the device's
 * local timezone. Users can change the device clock; no money or ranking depends on it.
 */
object DailySeed {
    fun seedForDay(dayKey: String): Long {
        val input = "blockestan-daily-v${GameBalanceConfig.DAILY_ALGORITHM_VERSION}-$dayKey"
        var hash = -0x340d631b7bdddcdbL // FNV-1a 64 offset basis
        input.forEach { ch ->
            hash = hash xor ch.code.toLong()
            hash *= 0x100000001b3L
        }
        // SplitMix64 finalizer for avalanche.
        var z = hash
        z = (z xor (z ushr 30)) * -4658895280553007687L
        z = (z xor (z ushr 27)) * -7723592293110705685L
        return z xor (z ushr 31)
    }
}
