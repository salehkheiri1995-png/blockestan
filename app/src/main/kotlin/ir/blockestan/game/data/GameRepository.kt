package ir.blockestan.game.data

import android.util.Log
import ir.blockestan.game.core.economy.Economy
import ir.blockestan.game.core.economy.EconomyResult
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CoinReason
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/**
 * Single owner of the persisted save. Every mutation is serialized by a mutex and written to
 * disk before it is published, so a process death cannot leave the UI and the file disagreeing.
 * Reads are in-memory after the initial synchronous load; writes happen on [Dispatchers.IO].
 */
class GameRepository(
    private val store: SaveStore,
    initial: LoadReport
) {
    private val mutex = Mutex()
    private val _save = MutableStateFlow(initial.data.sanitized())
    val save: StateFlow<AppSaveData> = _save.asStateFlow()
    val loadReport: LoadReport = initial

    suspend fun update(transform: (AppSaveData) -> AppSaveData): AppSaveData = mutex.withLock {
        val next = transform(_save.value).sanitized()
        persist(next)
        _save.value = next
        next
    }

    suspend fun mutateEconomy(block: (AppSaveData) -> EconomyResult): EconomyResult = mutex.withLock {
        when (val result = block(_save.value)) {
            is EconomyResult.Applied -> {
                val next = result.save.sanitized()
                persist(next)
                _save.value = next
                result
            }
            else -> result
        }
    }

    suspend fun spend(reason: CoinReason, requestId: String): EconomyResult {
        val cost = Economy.costOf(reason)
            ?: return EconomyResult.Rejected("Not a coin spend")
        return mutateEconomy { Economy.spend(it, cost, reason, requestId, now()) }
    }

    suspend fun grant(amount: Int, reason: CoinReason, requestId: String): EconomyResult =
        mutateEconomy { Economy.grant(it, amount, reason, requestId, now()) }

    suspend fun claimFirstWin(levelId: Int, requestId: String): EconomyResult =
        mutateEconomy { Economy.claimFirstLevelWin(it, levelId, requestId, now()) }

    suspend fun claimDaily(dayKey: String, requestId: String): EconomyResult =
        mutateEconomy { Economy.claimDailyReward(it, dayKey, requestId, now()) }

    suspend fun buyTheme(themeId: String, requestId: String): EconomyResult =
        mutateEconomy { Economy.purchaseTheme(it, themeId, requestId, now()) }

    suspend fun markRewardedAt(nowMs: Long = now()): AppSaveData =
        update { it.copy(lastRewardedAtMs = nowMs) }

    suspend fun markInterstitialAt(nowMs: Long = now()): AppSaveData =
        update { it.copy(lastInterstitialAtMs = nowMs) }

    suspend fun resetProgress(): AppSaveData = update {
        AppSaveData(
            coins = it.coins,
            soundEnabled = it.soundEnabled,
            vibrationEnabled = it.vibrationEnabled,
            reduceMotion = it.reduceMotion,
            personalizedAdsConsent = it.personalizedAdsConsent,
            onboardingDone = true,
            ownedThemes = it.ownedThemes,
            selectedTheme = it.selectedTheme
        )
    }

    private suspend fun persist(next: AppSaveData) {
        val error = withContext(Dispatchers.IO) { store.save(next, now()) }
        if (error != null) Log.e(TAG, error)
    }

    private fun now(): Long = System.currentTimeMillis()

    companion object {
        private const val TAG = "BlockestanSave"
    }
}
