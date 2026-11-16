package ir.blockestan.game.core

import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.generation.DailySeed
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class DailySeedTest {

    @Test
    fun the_same_day_key_always_produces_the_same_seed() {
        val a = DailySeed.seedForDay("2026-11-16")
        val b = DailySeed.seedForDay("2026-11-16")
        assertEquals(a, b)
    }

    @Test
    fun consecutive_days_produce_different_seeds() {
        val a = DailySeed.seedForDay("2026-11-16")
        val b = DailySeed.seedForDay("2026-11-17")
        assertNotEquals(a, b)
    }

    @Test
    fun the_seed_depends_on_the_algorithm_version() {
        // The version is part of the hashed input; this guards accidental algorithm drift.
        val seed = DailySeed.seedForDay("2026-11-16")
        val expected = run {
            val input = "blockestan-daily-v${GameBalanceConfig.DAILY_ALGORITHM_VERSION}-2026-11-16"
            var hash = -0x340d631b7bdddcdbL
            input.forEach { ch ->
                hash = hash xor ch.code.toLong()
                hash *= 0x100000001b3L
            }
            var z = hash
            z = (z xor (z ushr 30)) * -4658895280553007687L
            z = (z xor (z ushr 27)) * -7723592293110705685L
            z xor (z ushr 31)
        }
        assertEquals(expected, seed)
    }
}
