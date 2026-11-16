package ir.blockestan.game.core

import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.persistence.ActiveRunSave
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CoinReason
import ir.blockestan.game.core.persistence.CoinTransaction
import ir.blockestan.game.core.persistence.CorruptSaveException
import ir.blockestan.game.core.persistence.DailySave
import ir.blockestan.game.core.persistence.SaveCodec
import ir.blockestan.game.core.persistence.SaveFormat
import ir.blockestan.game.core.persistence.StatsSave
import ir.blockestan.game.core.persistence.UnsupportedSaveVersionException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.Assert.assertThrows

class SaveCodecTest {

    private fun richSave(): AppSaveData {
        val session = GameSession.newClassic(777L)
        assertTrue(session.place(0, 0, 0) is PlacementOutcome.Success)
        assertTrue(session.place(1, 4, 4) is PlacementOutcome.Success)
        return AppSaveData(
            coins = 123,
            ownedThemes = setOf("turquoise", "purple_night"),
            selectedTheme = "purple_night",
            soundEnabled = false,
            vibrationEnabled = false,
            reduceMotion = true,
            personalizedAdsConsent = true,
            onboardingDone = true,
            unlockedLevel = 17,
            levelStars = mapOf(1 to 3, 2 to 2),
            firstWinClaimed = setOf(1, 2),
            classicBest = 450,
            daily = DailySave("2026-11-16", 510, true),
            activeRun = ActiveRunSave(
                mode = GameMode.CLASSIC,
                levelId = null,
                dayKey = null,
                state = session.state
            ),
            stats = StatsSave(runsFinished = 9, classicRuns = 4, levelWins = 5, rewardedShows = 2),
            transactions = listOf(
                CoinTransaction("tx-1", CoinReason.REWARDED_AD, 40, 1_700_000_000_000L, "req-1")
            ),
            grantedAdRewardIds = listOf("req-1"),
            appliedRequestIds = listOf("req-1")
        )
    }

    @Test
    fun save_round_trip_preserves_every_field_including_the_active_run() {
        val original = richSave()
        val raw = SaveCodec.encode(original, 1_700_000_000_000L)
        val decoded = SaveCodec.decode(raw)
        assertEquals(original, decoded)
        assertEquals(original.activeRun?.state, decoded.activeRun?.state)
        assertEquals(SaveFormat.CURRENT, SaveCodec.peekVersion(raw))
        assertNotNull(decoded.activeRun)
        // The restored run resumes with the same future randomness.
        val restored = GameSession.restore(
            GameMode.CLASSIC,
            null,
            decoded.activeRun!!.state
        )
        assertFalseWon(restored.state.status)
        assertEquals(original.activeRun!!.state.rngState, restored.state.rngState)
    }

    private fun assertFalseWon(status: RunStatus) {
        assertTrue(status == RunStatus.PLAYING || status == RunStatus.LOST)
    }

    @Test
    fun save_restore_continues_with_the_same_rng_sequence() {
        val original = richSave()
        val decoded = SaveCodec.decode(SaveCodec.encode(original, 0L))
        val a = GameSession.restore(GameMode.CLASSIC, null, original.activeRun!!.state)
        val b = GameSession.restore(GameMode.CLASSIC, null, decoded.activeRun!!.state)
        // Find any legal slot/position and verify both copies behave identically.
        val slot = (0..2).first { a.state.tray[it] != null }
        val position = (0 until 8).firstNotNullOf { row ->
            (0 until 8).firstOrNull { col -> a.canPlace(slot, row, col) }?.let { row to it }
        }
        a.place(slot, position.first, position.second)
        b.place(slot, position.first, position.second)
        assertEquals(a.state, b.state)
    }

    @Test
    fun corrupt_json_is_reported_and_never_partially_loaded() {
        assertThrows(CorruptSaveException::class.java) {
            SaveCodec.decode("{not json")
        }
        assertThrows(CorruptSaveException::class.java) {
            SaveCodec.decode("""{"formatVersion":1,"savedAtEpochMs":0,"data":{"coins":"x"}}""")
        }
        assertNull(SaveCodec.peekVersion("garbage"))
    }

    @Test
    fun a_newer_save_version_is_refused_instead_of_silently_downgraded() {
        val raw = """{"formatVersion":99,"savedAtEpochMs":0,"data":{"coins":10}}"""
        assertThrows(UnsupportedSaveVersionException::class.java) {
            SaveCodec.decode(raw)
        }
        assertEquals(99, SaveCodec.peekVersion(raw))
    }

    @Test
    fun invalid_saved_values_are_sanitized_on_load() {
        val raw = """{"formatVersion":1,"savedAtEpochMs":0,"data":{
            "formatVersion":1,"coins":-40,"ownedThemes":[],"selectedTheme":"bogus",
            "unlockedLevel":5000,"levelStars":{"77":3},"firstWinClaimed":[0]
        }}"""
        val decoded = SaveCodec.decode(raw)
        assertEquals(0, decoded.coins)
        assertTrue("turquoise" in decoded.ownedThemes)
        assertEquals("turquoise", decoded.selectedTheme)
        assertEquals(60, decoded.unlockedLevel)
        assertTrue(decoded.levelStars.isEmpty())
        assertTrue(decoded.firstWinClaimed.isEmpty())
    }
}
