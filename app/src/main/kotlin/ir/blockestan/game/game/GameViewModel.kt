package ir.blockestan.game.game

import android.app.Activity
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ir.blockestan.game.BlockestanApp
import ir.blockestan.game.ads.InterstitialPolicy
import ir.blockestan.game.ads.RewardedAdEvent
import ir.blockestan.game.core.economy.Economy
import ir.blockestan.game.core.economy.EconomyResult
import ir.blockestan.game.core.engine.GameBalanceConfig
import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.generation.DailySeed
import ir.blockestan.game.core.generation.LevelCatalog
import ir.blockestan.game.core.generation.LevelDefinition
import ir.blockestan.game.core.model.BoosterOutcome
import ir.blockestan.game.core.model.GameMode
import ir.blockestan.game.core.model.PlacementError
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RescuePlan
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.persistence.ActiveRunSave
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CoinReason
import ir.blockestan.game.core.persistence.DailySave
import ir.blockestan.game.util.DateKeys
import ir.blockestan.game.util.Haptics
import ir.blockestan.game.util.RequestIds
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.min

class GameViewModel(application: Application) : AndroidViewModel(application) {
    private val container = (application as BlockestanApp).container
    private val repo = container.repository
    private val ads = container.ads
    private val sound = container.soundPlayer
    private val policy = InterstitialPolicy()

    private val _ui = MutableStateFlow(
        GameUiState(
            save = repo.save.value,
            adStatusLabel = ads.statusLabel(),
            rewardedConfigured = ads.rewarded.configured,
            rewardedSimulated = ads.rewarded.simulated,
            interstitialConfigured = ads.interstitial.configured
        )
    )
    val uiState: StateFlow<GameUiState> = _ui.asStateFlow()

    private var session: GameSession? = null
    private var finalized = false
    private var actionInFlight = false
    private var pendingPurpose: RewardPurpose? = null
    private var pendingAdRequestId: String? = null
    private var rewardHandled = false
    private var rewardDelivered = false

    init {
        viewModelScope.launch {
            repo.save.collect { save -> _ui.update { it.copy(save = save) } }
        }
        repo.loadReport.error?.let { message ->
            _ui.update { it.copy(snack = message) }
        }
        if (repo.loadReport.recoveredFromBackup) {
            _ui.update { it.copy(snack = "ذخیره از نسخهٔ پشتیبان بازیابی شد.") }
        }
        ads.preload()
    }

    // ---------------------------------------------------------------- navigation

    fun goHome() {
        if (_ui.value.result != null && !finalized) {
            declineContinue()
            return
        }
        _ui.update {
            it.copy(
                screen = Screen.HOME,
                drag = null,
                hammerMode = false,
                result = null,
                pendingRescue = null,
                snack = null
            )
        }
        session = null
    }

    fun openLevels() = _ui.update { it.copy(screen = Screen.LEVELS, snack = null) }
    fun openShop() = _ui.update { it.copy(screen = Screen.SHOP, snack = null) }
    fun openSettings() = _ui.update { it.copy(screen = Screen.SETTINGS, snack = null) }
    fun openPrivacy() = _ui.update { it.copy(screen = Screen.PRIVACY, snack = null) }

    fun back(): Boolean {
        val state = _ui.value
        return when {
            state.result != null -> {
                declineContinue()
                true
            }
            state.screen == Screen.GAME -> {
                goHome()
                true
            }
            state.screen != Screen.HOME -> {
                goHome()
                true
            }
            else -> false
        }
    }

    // ---------------------------------------------------------------- run lifecycle

    fun startClassic() {
        val active = repo.save.value.activeRun
        if (active?.mode == GameMode.CLASSIC && active.state.status == RunStatus.PLAYING) {
            resumeActive()
            return
        }
        val seed = System.nanoTime() xor (System.currentTimeMillis() shl 19)
        begin(GameSession.newClassic(seed), GameMode.CLASSIC, null, null)
    }

    fun startLevel(levelId: Int) {
        val save = repo.save.value
        if (levelId > save.unlockedLevel) {
            snack("این مرحله هنوز باز نشده است.")
            return
        }
        val level = LevelCatalog.byId(levelId) ?: run {
            snack("مرحله پیدا نشد.")
            return
        }
        begin(GameSession.newLevel(level), GameMode.LEVEL, level, null)
    }

    fun startDaily() {
        val key = DateKeys.today()
        if (repo.save.value.daily.dayKey != key) {
            viewModelScope.launch {
                repo.update { save ->
                    if (save.daily.dayKey == key) save
                    else save.copy(daily = DailySave(dayKey = key))
                }
            }
        }
        begin(GameSession.newDaily(DailySeed.seedForDay(key)), GameMode.DAILY, null, key)
    }

    fun resumeActive() {
        val active = repo.save.value.activeRun ?: run {
            snack("بازی نیمه‌تمام ذخیره‌شده‌ای وجود ندارد.")
            return
        }
        if (active.state.status != RunStatus.PLAYING) {
            snack("آن بازی تمام شده است.")
            return
        }
        val level = active.levelId?.let { LevelCatalog.byId(it) }
        if (active.mode == GameMode.LEVEL && level == null) {
            snack("دادهٔ مرحله در دسترس نیست.")
            return
        }
        val restored = GameSession.restore(active.mode, level, active.state)
        session = restored
        finalized = false
        _ui.update {
            it.copy(
                screen = Screen.GAME,
                session = restored.state,
                mode = active.mode,
                level = level,
                dayKey = active.dayKey,
                result = null,
                pendingRescue = null,
                drag = null,
                hammerMode = false,
                inputLocked = false,
                snack = null
            )
        }
    }

    private fun begin(
        newSession: GameSession,
        mode: GameMode,
        level: LevelDefinition?,
        dayKey: String?
    ) {
        session = newSession
        finalized = false
        actionInFlight = false
        _ui.update {
            it.copy(
                screen = Screen.GAME,
                session = newSession.state,
                mode = mode,
                level = level,
                dayKey = dayKey,
                result = null,
                pendingRescue = null,
                drag = null,
                hammerMode = false,
                inputLocked = false,
                lastCleared = emptyList(),
                snack = null
            )
        }
        autosave()
    }

    // ---------------------------------------------------------------- placement

    fun canPlace(slot: Int, row: Int, col: Int): Boolean {
        if (!_ui.value.isPlaying) return false
        return session?.canPlace(slot, row, col) == true
    }

    fun placePiece(slot: Int, row: Int, col: Int) {
        val active = session ?: return
        if (!_ui.value.isPlaying) return
        _ui.update { it.copy(inputLocked = true, drag = null, hammerMode = false) }
        when (val outcome = active.place(slot, row, col)) {
            is PlacementOutcome.Invalid -> {
                sound.playInvalid(_ui.value.save.soundEnabled)
                vibrate()
                _ui.update {
                    it.copy(inputLocked = false, snack = messageFor(outcome.reason))
                }
            }
            is PlacementOutcome.Success -> {
                sound.playPlace(_ui.value.save.soundEnabled)
                if (outcome.lines > 0) {
                    sound.playClear(_ui.value.save.soundEnabled)
                    vibrate()
                }
                _ui.update {
                    it.copy(
                        session = active.state,
                        inputLocked = outcome.status != RunStatus.PLAYING,
                        drag = null,
                        lastCleared = outcome.clearedCells
                    )
                }
                if (outcome.status == RunStatus.WON) {
                    onWin()
                } else if (outcome.status == RunStatus.LOST) {
                    onLoss()
                } else {
                    autosave()
                }
            }
        }
    }

    fun updateDrag(drag: DragUi?) = _ui.update { it.copy(drag = drag) }

    fun dropDrag() {
        val drag = _ui.value.drag ?: return
        _ui.update { it.copy(drag = null) }
        if (!drag.valid) {
            sound.playInvalid(_ui.value.save.soundEnabled)
            vibrate()
            snack("این قطعه در اینجا جا نمی‌شود.")
            return
        }
        placePiece(drag.slot, drag.targetRow, drag.targetCol)
    }

    private fun messageFor(reason: PlacementError): String = when (reason) {
        PlacementError.NOT_PLAYING -> "بازی در این وضعیت قابل حرکت نیست."
        PlacementError.EMPTY_SLOT -> "این خانه خالی است."
        PlacementError.OUT_OF_BOUNDS -> "بیرون از زمین بازی است."
        PlacementError.OVERLAP -> "این خانه‌ها پر هستند."
        PlacementError.NO_LEGAL_MOVE -> "حرکت قانونی وجود ندارد."
    }

    // ---------------------------------------------------------------- end of run

    private fun onWin() {
        viewModelScope.launch {
            val result = finalizeRun(won = true)
            _ui.update { it.copy(result = result, pendingRescue = null, inputLocked = true) }
        }
    }

    private fun onLoss() {
        val active = session ?: return
        val plan = active.rescuePlan()
        _ui.update { it.copy(pendingRescue = plan, inputLocked = true, drag = null) }
        if (plan == null) {
            viewModelScope.launch {
                val result = finalizeRun(won = false)
                _ui.update { it.copy(result = result, pendingRescue = null) }
            }
        } else {
            val state = active.state
            _ui.update {
                it.copy(
                    result = ResultUi(
                        mode = it.mode ?: GameMode.CLASSIC,
                        won = false,
                        score = state.score,
                        lines = state.linesCleared,
                        stars = 0,
                        coinsEarned = 0,
                        newPersonalBest = false,
                        levelId = it.level?.id,
                        canContinue = true,
                        dailyReward = false,
                        nextLevelAvailable = false
                    )
                )
            }
        }
    }

    private suspend fun finalizeRun(won: Boolean): ResultUi {
        val active = session ?: return emptyResult(won)
        val state = active.state
        val ui = _ui.value
        val mode = ui.mode ?: GameMode.CLASSIC
        val level = ui.level
        if (finalized) return _ui.value.result ?: emptyResult(won)
        finalized = true

        var coinsEarned = 0
        var newBest = false
        val stars = if (won && level != null) starsFor(level, state.score) else 0
        val now = System.currentTimeMillis()

        when (mode) {
            GameMode.LEVEL -> {
                if (level != null) {
                    repo.update { save ->
                        var next = save.copy(
                            unlockedLevel = if (won) {
                                max(save.unlockedLevel, min(level.id + 1, GameBalanceConfig.TOTAL_LEVELS))
                            } else {
                                save.unlockedLevel
                            },
                            levelStars = if (won) {
                                save.levelStars + (level.id to max(save.levelStars[level.id] ?: 0, stars))
                            } else {
                                save.levelStars
                            },
                            stats = save.stats.copy(
                                runsFinished = save.stats.runsFinished + 1,
                                levelWins = save.stats.levelWins + if (won) 1 else 0
                            ),
                            activeRun = null
                        )
                        if (won && level.id !in next.firstWinClaimed) {
                            val requestId = "firstwin-${level.id}-${state.seed}"
                            when (val claim = Economy.claimFirstLevelWin(next, level.id, requestId, now)) {
                                is EconomyResult.Applied -> {
                                    coinsEarned = GameBalanceConfig.FIRST_LEVEL_WIN_COINS
                                    next = claim.save
                                }
                                else -> Unit
                            }
                        }
                        next
                    }
                }
            }
            GameMode.CLASSIC -> {
                newBest = state.score > repo.save.value.classicBest
                repo.update { save ->
                    save.copy(
                        classicBest = max(save.classicBest, state.score),
                        stats = save.stats.copy(
                            runsFinished = save.stats.runsFinished + 1,
                            classicRuns = save.stats.classicRuns + 1
                        ),
                        activeRun = null
                    )
                }
            }
            GameMode.DAILY -> {
                val key = ui.dayKey ?: DateKeys.today()
                repo.update { save ->
                    Economy.recordDailyResult(
                        save.copy(
                            stats = save.stats.copy(runsFinished = save.stats.runsFinished + 1),
                            activeRun = null
                        ),
                        key,
                        state.score
                    )
                }
                if (state.score >= GameBalanceConfig.DAILY_REWARD_SCORE) {
                    when (val claim = repo.claimDaily(key, "daily-$key")) {
                        is EconomyResult.Applied -> {
                            coinsEarned = GameBalanceConfig.DAILY_REWARD_COINS
                        }
                        else -> Unit
                    }
                }
            }
        }

        if (coinsEarned > 0) {
            sound.playCoin(_ui.value.save.soundEnabled)
        }
        if (won) sound.playWin(_ui.value.save.soundEnabled)

        val nextLevelAvailable = won && level != null &&
            level.id < GameBalanceConfig.TOTAL_LEVELS &&
            repo.save.value.unlockedLevel > level.id

        return ResultUi(
            mode = mode,
            won = won,
            score = state.score,
            lines = state.linesCleared,
            stars = stars,
            coinsEarned = coinsEarned,
            newPersonalBest = newBest,
            levelId = level?.id,
            canContinue = false,
            dailyReward = mode == GameMode.DAILY && coinsEarned > 0,
            nextLevelAvailable = nextLevelAvailable
        )
    }

    private fun emptyResult(won: Boolean) = ResultUi(
        mode = _ui.value.mode ?: GameMode.CLASSIC,
        won = won,
        score = 0,
        lines = 0,
        stars = 0,
        coinsEarned = 0,
        newPersonalBest = false,
        levelId = _ui.value.level?.id,
        canContinue = false,
        dailyReward = false,
        nextLevelAvailable = false
    )

    private fun starsFor(level: LevelDefinition, score: Int): Int = when {
        score >= level.starThresholds.threeStars -> 3
        score >= level.starThresholds.twoStars -> 2
        else -> 1
    }

    // ---------------------------------------------------------------- boosters

    fun requestUndo() {
        val active = session ?: return
        if (!_ui.value.isPlaying) return
        if (active.state.undo == null) {
            snack("حرکت قابل بازگشتی وجود ندارد.")
            return
        }
        spendBooster(CoinReason.UNDO) { active.undo() }
    }

    fun requestSwap() {
        val active = session ?: return
        if (!_ui.value.isPlaying) return
        if (active.state.tray.all { it == null }) {
            snack("قطعه‌ای برای تعویض نمانده است.")
            return
        }
        spendBooster(CoinReason.SWAP) { active.swapUnusedPieces() }
    }

    fun toggleHammer() {
        val active = session ?: return
        if (!_ui.value.isPlaying) return
        if (_ui.value.save.coins < GameBalanceConfig.HAMMER_COST) {
            snack("برای چکش به ${GameBalanceConfig.HAMMER_COST.fa()} سکه نیاز داری.")
            return
        }
        _ui.update { it.copy(hammerMode = !it.hammerMode, drag = null) }
    }

    fun hammerAt(row: Int, col: Int) {
        val active = session ?: return
        if (!_ui.value.isPlaying) return
        val region = active.hammerRegion(row, col)
        if (region.none { active.state.board[it] != 0 }) {
            sound.playInvalid(_ui.value.save.soundEnabled)
            snack("در این محدوده چیزی برای شکستن نیست.")
            return
        }
        spendBooster(CoinReason.HAMMER) { active.useHammer(row, col) }
    }

    private fun spendBooster(
        reason: CoinReason,
        apply: () -> BoosterOutcome
    ) {
        if (actionInFlight) return
        val active = session ?: return
        val cost = Economy.costOf(reason) ?: return
        if (repo.save.value.coins < cost) {
            snack("سکه کافی نیست. برای دریافت سکه می‌توانی تبلیغ جایزه‌دار ببینی.")
            return
        }
        actionInFlight = true
        // A fresh UUID per user action avoids collisions when the same board state is revisited
        // (for example place, undo, place the same piece again, undo again). Concurrent double
        // taps are already blocked by actionInFlight.
        val requestId = "booster-${reason.name.lowercase()}-${RequestIds.new()}"
        _ui.update { it.copy(inputLocked = true, drag = null, hammerMode = false) }
        viewModelScope.launch {
            try {
                when (val spend = repo.spend(reason, requestId)) {
                    is EconomyResult.Applied -> {
                        when (val outcome = apply()) {
                            is BoosterOutcome.Applied -> {
                                _ui.update {
                                    it.copy(
                                        session = active.state,
                                        inputLocked = false,
                                        hammerMode = false,
                                        drag = null,
                                        lastCleared = outcome.clearedCells
                                    )
                                }
                                sound.playClear(_ui.value.save.soundEnabled)
                                autosave()
                            }
                            else -> {
                                repo.grant(cost, CoinReason.ADJUST, "refund-$requestId")
                                snack("این تقویت‌کننده در این وضعیت قابل استفاده نبود؛ سکه بازگردانده شد.")
                            }
                        }
                    }
                    EconomyResult.InsufficientFunds ->
                        snack("سکه کافی نیست. برای دریافت سکه می‌توانی تبلیغ جایزه‌دار ببینی.")
                    is EconomyResult.Duplicate -> Unit
                    is EconomyResult.Rejected -> snack("انجام این کار ممکن نیست.")
                }
            } finally {
                actionInFlight = false
                _ui.update {
                    if (it.result == null) it.copy(inputLocked = false) else it
                }
            }
        }
    }

    // ---------------------------------------------------------------- continue

    fun continueWithCoins() {
        val active = session ?: return
        val plan = _ui.value.pendingRescue ?: return
        if (actionInFlight) return
        if (repo.save.value.coins < GameBalanceConfig.CONTINUE_COST) {
            snack("سکه کافی نیست.")
            return
        }
        actionInFlight = true
        val requestId = "continue-${RequestIds.new()}"
        viewModelScope.launch {
            when (val spend = repo.spend(CoinReason.CONTINUE, requestId)) {
                is EconomyResult.Applied -> {
                    if (active.applyRescue(plan)) {
                        resumeAfterContinue(active)
                    } else {
                        repo.grant(
                            GameBalanceConfig.CONTINUE_COST,
                            CoinReason.ADJUST,
                            "refund-$requestId"
                        )
                        snack("ادامه ممکن نبود؛ سکه بازگردانده شد.")
                    }
                }
                EconomyResult.InsufficientFunds -> snack("سکه کافی نیست.")
                is EconomyResult.Duplicate -> snack("این ادامه قبلاً پرداخت شده است.")
                is EconomyResult.Rejected -> snack("انجام این کار ممکن نیست.")
            }
            actionInFlight = false
        }
    }

    fun continueWithAd(activity: Activity) {
        if (_ui.value.pendingRescue == null) return
        requestRewarded(activity, RewardPurpose.CONTINUE)
    }

    private fun resumeAfterContinue(active: GameSession) {
        finalized = false
        _ui.update {
            it.copy(
                result = null,
                pendingRescue = null,
                inputLocked = false,
                session = active.state,
                drag = null,
                hammerMode = false
            )
        }
        autosave()
        snack("بازی ادامه یافت.")
    }

    fun declineContinue() {
        val ui = _ui.value
        if (ui.pendingRescue == null && finalized) {
            _ui.update { it.copy(result = null, pendingRescue = null) }
            goHome()
            return
        }
        _ui.update { it.copy(pendingRescue = null) }
        viewModelScope.launch {
            val result = finalizeRun(won = false)
            _ui.update { it.copy(result = result, pendingRescue = null, inputLocked = true) }
        }
    }

    // ---------------------------------------------------------------- result navigation

    fun playAgain(activity: Activity) {
        val mode = _ui.value.mode
        val levelId = _ui.value.level?.id
        navigateFromResult(activity) {
            when (mode) {
                GameMode.LEVEL -> if (levelId != null) startLevel(levelId)
                GameMode.DAILY -> startDaily()
                else -> startClassic()
            }
        }
    }

    fun nextLevel(activity: Activity) {
        val ui = _ui.value
        val next = (ui.level?.id ?: return) + 1
        navigateFromResult(activity) { startLevel(next) }
    }

    fun homeFromResult(activity: Activity) {
        if (!finalized && _ui.value.pendingRescue != null) {
            _ui.update { it.copy(pendingRescue = null) }
            viewModelScope.launch {
                finalizeRun(won = false)
                goHome()
            }
            return
        }
        navigateFromResult(activity) { goHome() }
    }

    private fun navigateFromResult(activity: Activity, action: () -> Unit) {
        viewModelScope.launch {
            if (!finalized && _ui.value.pendingRescue != null) {
                _ui.update { it.copy(pendingRescue = null) }
                finalizeRun(won = false)
            }
            val save = repo.save.value
            val should = ads.interstitial.configured && policy.shouldShow(
                runsFinished = save.stats.runsFinished,
                nowMs = System.currentTimeMillis(),
                lastInterstitialAtMs = save.lastInterstitialAtMs.takeIf { it > 0 },
                lastRewardedAtMs = save.lastRewardedAtMs.takeIf { it > 0 }
            )
            if (!should) {
                action()
                return@launch
            }
            var done = false
            val onClosed: (Boolean) -> Unit = { shown ->
                if (!done) {
                    done = true
                    if (shown) {
                        viewModelScope.launch { repo.markInterstitialAt() }
                    }
                    action()
                }
            }
            val shown = ads.interstitial.show(activity, onClosed)
            if (!shown && !done) onClosed(false)
        }
    }

    // ---------------------------------------------------------------- ads

    fun requestRewardedCoins(activity: Activity) {
        if (!ads.rewarded.configured) {
            snack("تبلیغ جایزه‌دار در این نسخه پیکربندی نشده است.")
            return
        }
        requestRewarded(activity, RewardPurpose.COINS)
    }

    private fun requestRewarded(activity: Activity, purpose: RewardPurpose) {
        if (_ui.value.ad.showing) return
        pendingPurpose = purpose
        pendingAdRequestId = "ad-${RequestIds.new()}"
        rewardHandled = false
        rewardDelivered = false
        _ui.update {
            it.copy(
                ad = AdUi(
                    showing = true,
                    simulated = ads.rewarded.simulated,
                    purpose = purpose
                )
            )
        }
        ads.rewarded.show(activity) { event -> onAdEvent(event) }
    }

    private fun onAdEvent(event: RewardedAdEvent) {
        when (event) {
            RewardedAdEvent.Shown -> _ui.update {
                it.copy(ad = it.ad.copy(showing = true, simulated = ads.rewarded.simulated))
            }
            RewardedAdEvent.Reward -> {
                if (rewardHandled) return
                rewardHandled = true
                rewardDelivered = true
                val purpose = pendingPurpose
                val requestId = pendingAdRequestId
                viewModelScope.launch {
                    repo.markRewardedAt()
                    when (purpose) {
                        RewardPurpose.COINS -> grantAdCoins(requestId)
                        RewardPurpose.CONTINUE -> applyRescueFromAd()
                        null -> Unit
                    }
                }
            }
            RewardedAdEvent.Closed -> {
                val purpose = pendingPurpose
                if (purpose == RewardPurpose.CONTINUE && !rewardDelivered) {
                    snack("برای ادامه باید تبلیغ کامل دیده شود.")
                }
                pendingPurpose = null
                pendingAdRequestId = null
                _ui.update { it.copy(ad = AdUi()) }
            }
            is RewardedAdEvent.Failed -> {
                pendingPurpose = null
                pendingAdRequestId = null
                _ui.update { it.copy(ad = AdUi(message = event.message)) }
                snack(event.message)
            }
        }
    }

    private suspend fun grantAdCoins(requestId: String?) {
        if (requestId == null) return
        when (val result = repo.grant(
            GameBalanceConfig.REWARDED_AD_COINS,
            CoinReason.REWARDED_AD,
            requestId
        )) {
            is EconomyResult.Applied -> {
                sound.playCoin(_ui.value.save.soundEnabled)
                _ui.update {
                    it.copy(snack = "${GameBalanceConfig.REWARDED_AD_COINS.fa()} سکه اضافه شد.")
                }
            }
            is EconomyResult.Duplicate -> Unit
            else -> snack("دریافت جایزه ممکن نشد.")
        }
    }

    private fun applyRescueFromAd() {
        val active = session ?: return
        val plan = _ui.value.pendingRescue ?: return
        if (active.applyRescue(plan)) {
            resumeAfterContinue(active)
        } else {
            snack("ادامه ممکن نبود.")
        }
    }

    // ---------------------------------------------------------------- shop / settings

    fun chooseTheme(themeId: String) {
        val save = repo.save.value
        if (themeId in save.ownedThemes) {
            if (save.selectedTheme == themeId) return
            viewModelScope.launch {
                repo.update { it.copy(selectedTheme = themeId) }
            }
            return
        }
        val price = GameBalanceConfig.themePrice(themeId)
        if (save.coins < price) {
            snack("برای این پوسته ${price.fa()} سکه لازم است.")
            return
        }
        val requestId = "theme-$themeId"
        viewModelScope.launch {
            when (val result = repo.buyTheme(themeId, requestId)) {
                is EconomyResult.Applied -> {
                    sound.playCoin(_ui.value.save.soundEnabled)
                    snack("پوسته خریداری و فعال شد.")
                }
                is EconomyResult.Duplicate -> repo.update { it.copy(selectedTheme = themeId) }
                EconomyResult.InsufficientFunds -> snack("سکه کافی نیست.")
                is EconomyResult.Rejected -> snack("خرید ممکن نیست.")
            }
        }
    }

    fun setSoundEnabled(enabled: Boolean) {
        viewModelScope.launch { repo.update { it.copy(soundEnabled = enabled) } }
    }

    fun setVibrationEnabled(enabled: Boolean) {
        viewModelScope.launch {
            repo.update { it.copy(vibrationEnabled = enabled) }
            if (enabled) Haptics.click(getApplication(), true)
        }
    }

    fun setReduceMotion(enabled: Boolean) {
        viewModelScope.launch { repo.update { it.copy(reduceMotion = enabled) } }
    }

    fun setPersonalizedConsent(activity: Activity, enabled: Boolean) {
        viewModelScope.launch {
            repo.update { it.copy(personalizedAdsConsent = enabled) }
            ads.applyConsent(activity, enabled)
        }
    }

    fun resetProgress() {
        viewModelScope.launch {
            session = null
            finalized = false
            repo.resetProgress()
            _ui.update {
                it.copy(
                    screen = Screen.HOME,
                    session = null,
                    mode = null,
                    level = null,
                    result = null,
                    pendingRescue = null,
                    snack = "پیشرفت بازی پاک شد."
                )
            }
        }
    }

    fun dismissSnack() = _ui.update { it.copy(snack = null) }

    // ---------------------------------------------------------------- helpers

    private fun autosave() {
        val active = session ?: return
        if (active.state.status != RunStatus.PLAYING) return
        val ui = _ui.value
        val mode = ui.mode ?: return
        val activeRun = ActiveRunSave(
            mode = mode,
            levelId = ui.level?.id,
            dayKey = ui.dayKey,
            state = active.state
        )
        viewModelScope.launch {
            repo.update { it.copy(activeRun = activeRun) }
        }
    }

    private fun snack(message: String) = _ui.update { it.copy(snack = message) }

    private fun vibrate() {
        if (_ui.value.save.vibrationEnabled) {
            Haptics.click(getApplication(), true)
        }
    }
}

private fun Int.fa(): String = ir.blockestan.game.util.Numbers.fa(this)
