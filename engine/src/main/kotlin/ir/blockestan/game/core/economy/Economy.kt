package ir.blockestan.game.core.economy

import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CoinReason
import ir.blockestan.game.core.persistence.CoinTransaction
import ir.blockestan.game.core.persistence.DailySave

/**
 * Result of a coin mutation. [Applied] always carries a new immutable save; the caller
 * replaces its stored save with it. Everything else leaves the save untouched.
 */
sealed interface EconomyResult {
    data class Applied(val save: AppSaveData, val transaction: CoinTransaction) : EconomyResult
    data class Duplicate(val requestId: String) : EconomyResult
    data object InsufficientFunds : EconomyResult
    data class Rejected(val reason: String) : EconomyResult
}

/**
 * The only place where virtual coins move. Coins are virtual only; this release has no
 * real-money purchases. Every mutation is idempotent by a caller-supplied request id.
 */
object Economy {
    fun costOf(reason: CoinReason): Int? = when (reason) {
        CoinReason.UNDO -> GameBalanceConfig.UNDO_COST
        CoinReason.SWAP -> GameBalanceConfig.SWAP_COST
        CoinReason.HAMMER -> GameBalanceConfig.HAMMER_COST
        CoinReason.CONTINUE -> GameBalanceConfig.CONTINUE_COST
        else -> null
    }

    fun grant(
        save: AppSaveData,
        amount: Int,
        reason: CoinReason,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        require(amount > 0) { "Grant amount must be positive" }
        require(reason != CoinReason.THEME_PURCHASE) { "Theme purchase is a spend" }
        require(reason != CoinReason.UNDO && reason != CoinReason.SWAP &&
            reason != CoinReason.HAMMER && reason != CoinReason.CONTINUE) {
            "Utility boosters are spends"
        }
        if (requestId.isBlank()) return EconomyResult.Rejected("Request id must not be blank")
        if (requestId in save.appliedRequestIds) return EconomyResult.Duplicate(requestId)

        val transaction = CoinTransaction(
            id = "tx-$requestId",
            reason = reason,
            amount = amount,
            atEpochMs = nowMs,
            requestId = requestId
        )
        val updated = save.copy(
            coins = save.coins + amount,
            transactions = (save.transactions + transaction).takeLast(AppSaveData.MAX_AUDIT_ROWS),
            grantedAdRewardIds = if (reason == CoinReason.REWARDED_AD) {
                (save.grantedAdRewardIds + requestId).takeLast(AppSaveData.MAX_GRANTED_IDS)
            } else {
                save.grantedAdRewardIds
            },
            appliedRequestIds = (save.appliedRequestIds + requestId)
                .takeLast(AppSaveData.MAX_APPLIED_IDS)
        ).sanitized()
        return EconomyResult.Applied(updated, transaction)
    }

    fun spend(
        save: AppSaveData,
        amount: Int,
        reason: CoinReason,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        require(amount > 0) { "Spend amount must be positive" }
        if (requestId.isBlank()) return EconomyResult.Rejected("Request id must not be blank")
        if (requestId in save.appliedRequestIds) return EconomyResult.Duplicate(requestId)
        if (save.coins < amount) return EconomyResult.InsufficientFunds

        val transaction = CoinTransaction(
            id = "tx-$requestId",
            reason = reason,
            amount = -amount,
            atEpochMs = nowMs,
            requestId = requestId
        )
        val updated = save.copy(
            coins = save.coins - amount,
            transactions = (save.transactions + transaction).takeLast(AppSaveData.MAX_AUDIT_ROWS),
            appliedRequestIds = (save.appliedRequestIds + requestId)
                .takeLast(AppSaveData.MAX_APPLIED_IDS)
        ).sanitized()
        return EconomyResult.Applied(updated, transaction)
    }

    /** Charged before the engine is asked to apply the booster. Refund is never automatic. */
    fun buyBooster(
        save: AppSaveData,
        reason: CoinReason,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        val cost = costOf(reason) ?: return EconomyResult.Rejected("Not a booster spend")
        return spend(save, cost, reason, requestId, nowMs)
    }

    /**
     * First completion of a campaign level pays once. Replays never pay again, even if the
     * player clears the level several times or restores a save file.
     */
    fun claimFirstLevelWin(
        save: AppSaveData,
        levelId: Int,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        if (levelId in save.firstWinClaimed) {
            return EconomyResult.Rejected("First win for level $levelId already claimed")
        }
        val base = save.copy(firstWinClaimed = save.firstWinClaimed + levelId)
        return when (val result = grant(
            base,
            GameBalanceConfig.FIRST_LEVEL_WIN_COINS,
            CoinReason.LEVEL_FIRST_WIN,
            requestId,
            nowMs
        )) {
            is EconomyResult.Applied -> result
            else -> result
        }
    }

    /**
     * Daily challenge pays once per local day key. The day key is supplied by the caller and
     * is derived from the device's local calendar; clock changes cannot mint more than one
     * reward per key, and the reward is not tied to any ranking or real value.
     */
    fun claimDailyReward(
        save: AppSaveData,
        dayKey: String,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        if (dayKey.isBlank()) return EconomyResult.Rejected("Day key must not be blank")
        if (save.daily.dayKey == dayKey && save.daily.rewardClaimed) {
            return EconomyResult.Rejected("Daily reward already claimed for $dayKey")
        }
        val previous = if (save.daily.dayKey == dayKey) save.daily else DailySave(dayKey = dayKey)
        val base = save.copy(daily = previous.copy(dayKey = dayKey, rewardClaimed = true))
        return when (val result = grant(
            base,
            GameBalanceConfig.DAILY_REWARD_COINS,
            CoinReason.DAILY_REWARD,
            requestId,
            nowMs
        )) {
            is EconomyResult.Applied -> result
            else -> result
        }
    }

    /**
     * Records today's best score. Reaching the reward threshold is not required to record a
     * result, and a failed attempt never consumes the day's reward: a later better run on the
     * same day can still claim it exactly once.
     */
    fun recordDailyResult(save: AppSaveData, dayKey: String, score: Int): AppSaveData {
        if (dayKey.isBlank()) return save
        val previous = if (save.daily.dayKey == dayKey) save.daily else DailySave(dayKey = dayKey)
        return save.copy(
            daily = previous.copy(
                dayKey = dayKey,
                bestScore = maxOf(previous.bestScore, score)
            )
        ).sanitized()
    }

    /** Virtual theme unlock. No real currency, no restore-code, no remote entitlement. */
    fun purchaseTheme(
        save: AppSaveData,
        themeId: String,
        requestId: String,
        nowMs: Long
    ): EconomyResult {
        if (!GameBalanceConfig.isValidTheme(themeId)) {
            return EconomyResult.Rejected("Unknown theme '$themeId'")
        }
        if (themeId in save.ownedThemes) {
            return EconomyResult.Rejected("Theme '$themeId' is already owned")
        }
        val price = GameBalanceConfig.themePrice(themeId)
        val spent = spend(save, price, CoinReason.THEME_PURCHASE, requestId, nowMs)
        return when (spent) {
            is EconomyResult.Applied -> {
                val updated = spent.save.copy(
                    ownedThemes = spent.save.ownedThemes + themeId,
                    selectedTheme = themeId
                )
                EconomyResult.Applied(updated, spent.transaction)
            }
            else -> spent
        }
    }
}
