package ir.blockestan.game.core

import ir.blockestan.game.core.economy.Economy
import ir.blockestan.game.core.economy.EconomyResult
import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CoinReason
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class EconomyTest {

    private val now = 1_700_000_000_000L

    @Test
    fun new_player_starts_with_the_configured_coin_balance() {
        val save = AppSaveData()
        assertEquals(150, save.coins)
        assertEquals(GameBalanceConfig.STARTING_COINS, save.coins)
    }

    @Test
    fun a_purchase_never_makes_the_balance_negative() {
        val save = AppSaveData(coins = 40)
        val result = Economy.buyBooster(save, CoinReason.HAMMER, "spend-1", now)
        assertEquals(EconomyResult.InsufficientFunds, result)
        assertEquals(40, save.coins)
    }

    @Test
    fun the_same_spend_request_is_charged_exactly_once() {
        val save = AppSaveData(coins = 150)
        val first = Economy.buyBooster(save, CoinReason.UNDO, "undo-run7-move4", now)
        assertTrue(first is EconomyResult.Applied)
        val charged = (first as EconomyResult.Applied).save
        assertEquals(100, charged.coins)
        assertEquals(-GameBalanceConfig.UNDO_COST, first.transaction.amount)

        val second = Economy.buyBooster(charged, CoinReason.UNDO, "undo-run7-move4", now)
        assertEquals(EconomyResult.Duplicate("undo-run7-move4"), second)
        assertEquals(100, charged.coins)
        assertEquals(1, charged.transactions.size)
    }

    @Test
    fun the_same_rewarded_ad_callback_is_granted_exactly_once() {
        val save = AppSaveData(coins = 0)
        val first = Economy.grant(
            save,
            GameBalanceConfig.REWARDED_AD_COINS,
            CoinReason.REWARDED_AD,
            "tap-reward-abc",
            now
        )
        assertTrue(first is EconomyResult.Applied)
        val granted = (first as EconomyResult.Applied).save
        assertEquals(GameBalanceConfig.REWARDED_AD_COINS, granted.coins)
        assertTrue("tap-reward-abc" in granted.grantedAdRewardIds)

        val replay = Economy.grant(
            granted,
            GameBalanceConfig.REWARDED_AD_COINS,
            CoinReason.REWARDED_AD,
            "tap-reward-abc",
            now
        )
        assertEquals(EconomyResult.Duplicate("tap-reward-abc"), replay)
        assertEquals(GameBalanceConfig.REWARDED_AD_COINS, granted.coins)
    }

    @Test
    fun a_blank_request_id_is_rejected() {
        val save = AppSaveData()
        val result = Economy.grant(save, 10, CoinReason.ADJUST, "  ", now)
        assertTrue(result is EconomyResult.Rejected)
        assertEquals(150, save.coins)
    }

    @Test
    fun first_level_win_pays_once_even_for_replays() {
        val save = AppSaveData(coins = 0)
        val first = Economy.claimFirstLevelWin(save, levelId = 4, requestId = "win-4-1", nowMs = now)
        assertTrue(first is EconomyResult.Applied)
        val paid = (first as EconomyResult.Applied).save
        assertEquals(GameBalanceConfig.FIRST_LEVEL_WIN_COINS, paid.coins)
        assertTrue(4 in paid.firstWinClaimed)

        val replay = Economy.claimFirstLevelWin(paid, levelId = 4, requestId = "win-4-2", nowMs = now)
        assertTrue(replay is EconomyResult.Rejected)
        assertEquals(GameBalanceConfig.FIRST_LEVEL_WIN_COINS, paid.coins)
    }

    @Test
    fun first_level_win_reward_is_not_paid_twice_through_a_duplicate_request() {
        val save = AppSaveData(coins = 0)
        val first = Economy.claimFirstLevelWin(save, 9, "win-9", now) as EconomyResult.Applied
        assertEquals(30, first.save.coins)
        // Even a fresh request id cannot pay again because the level is already claimed.
        val again = Economy.claimFirstLevelWin(first.save, 9, "win-9b", now)
        assertTrue(again is EconomyResult.Rejected)
        assertEquals(30, first.save.coins)
    }

    @Test
    fun daily_reward_is_paid_once_per_local_day_key() {
        val save = AppSaveData(coins = 0)
        val first = Economy.claimDailyReward(save, "2026-11-16", "daily-2026-11-16", now)
        assertTrue(first is EconomyResult.Applied)
        val paid = (first as EconomyResult.Applied).save
        assertEquals(GameBalanceConfig.DAILY_REWARD_COINS, paid.coins)
        assertTrue(paid.daily.rewardClaimed)

        val sameDay = Economy.claimDailyReward(paid, "2026-11-16", "daily-again", now)
        assertTrue(sameDay is EconomyResult.Rejected)
        assertEquals(GameBalanceConfig.DAILY_REWARD_COINS, paid.coins)

        val nextDay = Economy.claimDailyReward(paid, "2026-11-17", "daily-2026-11-17", now)
        assertTrue(nextDay is EconomyResult.Applied)
        assertEquals(
            GameBalanceConfig.DAILY_REWARD_COINS * 2,
            (nextDay as EconomyResult.Applied).save.coins
        )
    }

    @Test
    fun a_daily_result_below_the_threshold_still_keeps_the_reward_available() {
        val save = AppSaveData(coins = 50)
        val recorded = Economy.recordDailyResult(save, "2026-11-16", 40)
        assertEquals(50, recorded.coins)
        assertFalse(recorded.daily.rewardClaimed)
        assertEquals(40, recorded.daily.bestScore)
        // The same day's reward can still be claimed after a better run.
        val claimed = Economy.claimDailyReward(recorded, "2026-11-16", "daily-late", now)
        assertTrue(claimed is EconomyResult.Applied)
        assertEquals(50 + GameBalanceConfig.DAILY_REWARD_COINS, (claimed as EconomyResult.Applied).save.coins)
    }

    @Test
    fun theme_purchase_charges_once_and_unlocks_the_theme() {
        val save = AppSaveData(coins = 400)
        val result = Economy.purchaseTheme(save, "purple_night", "theme-purple", now)
        assertTrue(result is EconomyResult.Applied)
        val bought = (result as EconomyResult.Applied).save
        assertEquals(400 - GameBalanceConfig.THEME_PURPLE_NIGHT_PRICE, bought.coins)
        assertTrue("purple_night" in bought.ownedThemes)
        assertEquals("purple_night", bought.selectedTheme)

        val again = Economy.purchaseTheme(bought, "purple_night", "theme-purple-2", now)
        assertTrue(again is EconomyResult.Rejected)
        assertEquals(400 - GameBalanceConfig.THEME_PURPLE_NIGHT_PRICE, bought.coins)
    }

    @Test
    fun free_theme_cannot_be_purchased_again() {
        val save = AppSaveData()
        val result = Economy.purchaseTheme(save, "turquoise", "theme-free", now)
        assertTrue(result is EconomyResult.Rejected)
        assertEquals(150, save.coins)
    }

    @Test
    fun sanitized_save_clamps_corrupt_values() {
        val dirty = AppSaveData(
            coins = -500,
            ownedThemes = emptySet(),
            selectedTheme = "not-a-theme",
            unlockedLevel = 999,
            levelStars = mapOf(1 to 9, 1000 to 3),
            firstWinClaimed = setOf(0, 2, 1000)
        ).sanitized()
        assertEquals(0, dirty.coins)
        assertTrue("turquoise" in dirty.ownedThemes)
        assertEquals("turquoise", dirty.selectedTheme)
        assertEquals(GameBalanceConfig.TOTAL_LEVELS, dirty.unlockedLevel)
        assertEquals(mapOf(1 to 3), dirty.levelStars)
        assertEquals(setOf(2), dirty.firstWinClaimed)
        assertFalse(dirty.transactions.size > AppSaveData.MAX_AUDIT_ROWS)
    }
}
