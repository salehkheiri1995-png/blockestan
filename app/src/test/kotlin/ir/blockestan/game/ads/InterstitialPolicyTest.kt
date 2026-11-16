package ir.blockestan.game.ads

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InterstitialPolicyTest {
    private val policy = InterstitialPolicy()

    @Test
    fun firstThreeCompletedRunsNeverShowAnInterstitial() {
        val now = 10_000_000L
        assertFalse(policy.shouldShow(1, now, null, null))
        assertFalse(policy.shouldShow(2, now, null, null))
        assertFalse(policy.shouldShow(3, now, null, null))
    }

    @Test
    fun firstAllowedRunIsTheFourthAndThenEveryThirdRun() {
        val now = 10_000_000L
        assertTrue(policy.shouldShow(4, now, null, null))
        assertFalse(policy.shouldShow(5, now, null, null))
        assertFalse(policy.shouldShow(6, now, null, null))
        assertTrue(policy.shouldShow(7, now, null, null))
        assertFalse(policy.shouldShow(8, now, null, null))
        assertFalse(policy.shouldShow(9, now, null, null))
        assertTrue(policy.shouldShow(10, now, null, null))
    }

    @Test
    fun minimumIntervalBetweenInterstitialsIsEnforced() {
        val now = 10_000_000L
        val last = now - 179_000L
        assertFalse(policy.shouldShow(7, now, last, null))
        assertTrue(policy.shouldShow(7, now, now - 180_000L, null))
    }

    @Test
    fun rewardedAdCooldownIsEnforced() {
        val now = 10_000_000L
        assertFalse(policy.shouldShow(7, now, null, now - 119_000L))
        assertTrue(policy.shouldShow(7, now, null, now - 120_000L))
    }

    @Test
    fun nonPositiveTimestampsAreTreatedAsMissing() {
        val now = 10_000_000L
        assertTrue(policy.shouldShow(4, now, 0L, 0L))
        assertTrue(policy.shouldShow(4, now, -1L, -1L))
    }

    @Test
    fun interstitialIsNeverShownAfterOnlyThreeRunsEvenWithoutHistory() {
        assertFalse(policy.shouldShow(3, Long.MAX_VALUE, null, null))
    }
}
