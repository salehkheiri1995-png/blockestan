# Architecture

## 1. Overview

Blockestan is a native Android game with two Gradle modules and a strict dependency direction:

```text
:app  ──────────────►  :engine
Compose UI              Pure Kotlin/JVM
ViewModel               Rules, scoring, level catalog,
Repository              economy, save codec
Ads
```

`:engine` has no Android dependency and is tested on the JVM. `:app` owns Android concerns: files, Compose, lifecycle, ads, sound and vibration. There is no WebView, Unity, bundled website, server, account system or analytics SDK.

```text
MainActivity
  └── BlockestanApp (Application)
        └── AppContainer
              ├── SaveStore            (AtomicFile on internal storage)
              ├── GameRepository       (single owner of AppSaveData, StateFlow)
              └── AdsController        (build-type provider selection)

MainActivity → GameViewModel → GameRepository / GameSession / Economy
                     │
                     ▼
             UiState (StateFlow) → Compose screens
```

## 2. Engine module

### 2.1 Core model

- `Board.kt` — 8×8 indexed board helpers, row/column math, full-line detection, shared-cell de-duplication.
- `GameModels.kt` — immutable `GameState`, `UndoSnapshot`, `PlacementOutcome`, `RescuePlan`, `BoosterOutcome`, goals and status enums.
- Piece colors are stored separately from geometry; color never changes rules or generation fairness.
- All public mutation entry points return a new state or an explicit outcome. The UI never edits a state object directly.

### 2.2 Rules and scoring

`GameSession` wraps a `GameState` and exposes:

- `place(trayIndex, slot, row, col)` — validates bounds, empty slot, overlap and run status.
- `undo()`, `swapUnusedPieces()`, `hammerRegion(row, col)`, `useHammer(row, col)`.
- `rescuePlan()` — returns a plan only when it can prove a legal move exists after the rescue.
- `resumeAfterContinue()` — allowed once per run and only when a rescue plan exists.

Placement algorithm:

1. Reject if the run is not `PLAYING`, slot is empty, or any shape cell falls outside the board.
2. Reject if any target cell is occupied.
3. Mark cells with the piece color.
4. Find every full row and column in the post-placement board.
5. Build a set of cells in full lines; a shared row/column cell is counted once.
6. Clear that set and pay line points once per cleared line.
7. Update combo, moves, score, targets, tray and RNG state.
8. If the tray is exhausted, refill it from the deterministic generator.
9. Only after refill, test the actual remaining pieces for a legal move and decide `LOST`.

Scoring formula (all constants in `GameBalanceConfig`):

```text
scoreGain = placedCells * POINTS_PER_PLACED_CELL
          + lines * POINTS_PER_LINE
          + max(0, lines - 1) * MULTI_LINE_BONUS_PER_EXTRA_LINE
multiplier = min(1 + combo * COMBO_MULTIPLIER_STEP, MAX_COMBO_MULTIPLIER)
```

The combo counts consecutive scoring moves, is capped at `MAX_COMBO`, and resets on a move that clears no line.

### 2.3 Piece generation

`PieceGenerator` is deterministic from `(seed, rngState)`. `Random.kt` is a small explicit PRNG so a save can restore the exact next tray. Shape weights depend only on the selected difficulty. Purchases, coins, ads, history and revenue have no input into generation.

### 2.4 Level catalog

`levels.json` is packaged in the `engine` resource set and loaded by `LevelCatalog`. Each level contains:

- board occupancy, target cells, goals, move limit, star thresholds;
- explicit tray sequence (so a reference solution is reproducible);
- a reference solution list of `(tray, slot, row, col)`.

The offline authoring tool `engine/src/test/.../tools/LevelGenerator.kt` produced all 60 levels and verified every reference replay through the production `GameSession`, not through a separate simplified simulator. The catalog is 260,550 bytes; 60 levels with 603 reference moves total (6–15 moves each); difficulty split is 15 EASY / 25 NORMAL / 20 HARD.

### 2.5 Daily challenge

`DailySeed.seedForDay(dayKey)` uses FNV-1a 64 plus a SplitMix64 finalizer over:

```text
blockestan-daily-v{DAILY_ALGORITHM_VERSION}-{localDateKey}
```

`dayKey` comes from the device's local calendar (`yyyy-MM-dd`). There is no server round trip. Changing the clock can change which challenge is offered, but the daily reward is guarded by the local day key and an idempotent request id; nothing of real value or ranking depends on it.

### 2.6 Persistence codec

`SaveCodec` writes a versioned envelope:

```json
{ "formatVersion": 1, "savedAtEpochMs": 0, "data": { ... } }
```

- Unknown JSON keys are ignored for forward-compatible additive fields.
- A newer format version is refused, not silently downgraded.
- Corrupt payloads raise `CorruptSaveException`; no partial object escapes.
- Migration hook exists but there are no historical releases yet.
- `AppSaveData.sanitized()` clamps corrupt values on every load and every write.

### 2.7 Economy

`Economy` is the only place coins move. Every grant and spend takes a caller-supplied `requestId` and records it in `appliedRequestIds`; duplicates return `EconomyResult.Duplicate` without changing the balance. First-level-win rewards also consult `firstWinClaimed`. Daily rewards consult `(dayKey, rewardClaimed)`. Spends fail on insufficient funds, so balances cannot go negative. Audit rows and id sets are capped to bound save size.

Boosters are charged before the engine is asked to apply them. If the engine rejects the action, the app refunds with a separate `"refund-$requestId"` grant; the original spend remains idempotent.

## 3. App module

### 3.1 Application and dependency container

`BlockestanApp` creates `AppContainer` once:

- `SaveStore(applicationContext)`
- `GameRepository(store, store.load())`
- `AdsController()`

`MainActivity` obtains the container, registers the Tapsell initialization listener (release + configured only), preloads ads, applies consent on resume, and hosts Compose.

### 3.2 State and ViewModel

`GameViewModel` exposes a single immutable `UiState` through `StateFlow`. Screens collect it with `collectAsStateWithLifecycle()`.

`UiState` carries:

- current screen and active `GameSession`/mode/level;
- derived tray, drag preview, hammer mode, input lock;
- result dialog data, continue availability;
- coin balance and save flags (sound, vibration, reduce motion, theme);
- ad overlay state and snackbar.

All user actions go through the ViewModel. It serializes economy mutations through the repository mutex, locks input while resolving a placement or transaction, and uses UUID-based request ids for boosters and continues. Deterministic state-hash ids were deliberately replaced: revisiting the same board state after undo could otherwise collide and be mistaken for a duplicate.

### 3.3 Repository and disk writes

`GameRepository` owns a `MutableStateFlow<AppSaveData>` and a `Mutex`. Every mutation:

1. computes the next immutable save,
2. sanitizes it,
3. writes it on `Dispatchers.IO`,
4. publishes it to the flow only after the write attempt.

`SaveStore` uses `android.util.AtomicFile` for the primary file and keeps the previous good file as `blockestan-save.backup.json`. A newer-version primary is never replaced by an older backup.

The game itself is offline. Network permission exists solely for ad loading.

### 3.4 Compose UI

| File | Responsibility |
|---|---|
| `AppRoot.kt` | screen routing, system back, snackbar, ad overlay, root background and insets |
| `HomeScreen.kt` | record, daily, campaign entry, coin balance |
| `LevelsScreen.kt` | 60-level grid, locks, stars, written difficulty labels |
| `GameScreen.kt` | drag gestures, tray, boosters, HUD, result dialog |
| `BoardView.kt` | board drawing, ghost preview, hammer selection, hit testing |
| `ShopScreen.kt` | virtual coin packs, rewarded ad entry, themes |
| `SettingsScreen.kt` | sound, vibration, reduced motion, consent, reset, privacy link |
| `PrivacyScreen.kt` | in-app privacy summary |
| `Theme.kt` | four palettes, Vazirmatn typography, RTL |
| `Components.kt` | shared buttons, chips, dialogs, coin badge |

### 3.5 Drag-and-drop and RTL

The board's hit grid is forced to `LayoutDirection.Ltr` for geometry only. Logical `(row, column)` coordinates therefore never mirror when the app language is Persian. The surrounding text and screens remain RTL. The tray is laid out in the normal reading order; drag math uses root coordinates and the board's LTR grid, so it does not depend on the tray's visual direction.

Gesture flow:

1. `detectDragGestures` starts on a tray piece; the ViewModel records `DragUi(slot, shape, color, pointer, grabCell, targetRow, targetCol, valid)`.
2. `BoardView` renders a ghost at the target and marks it with a solid outline when valid or a drawn cross when invalid. Meaning is not conveyed by color alone.
3. On drop, `GameViewModel.dropDrag()` checks the run status, input lock and legality. Invalid drops return the piece; valid drops place it once.
4. `onDragCancel` clears the preview. Input is locked while placement/clear animation and economy operations resolve.
5. The lifted piece is drawn in a root-level overlay so it is not clipped by the tray row.

### 3.6 Themes and accessibility

Four palettes are defined in `Theme.kt`. All text uses bundled Vazirmatn Regular/Bold. Board validity and Hammer mode use shape/outline cues in addition to color. `reduceMotion` disables non-essential animation. Sound and vibration are separate toggles. Layout uses window insets and weight-based sizing so an 8×8 board fits small phones and scales on tablets.

### 3.7 Ads

`AdsController` chooses providers by build type:

| Build | Config | Rewarded | Interstitial |
|---|---|---|---|
| Debug | any | `SimulatedRewardedAds` (labelled, no revenue) | none |
| Release | App ID + rewarded zone | `TapsellRewardedAds` | Tapsell if zone present |
| Release | blank/incomplete | `UnavailableRewardedAds` (no reward) | none |

`InterstitialPolicy` is pure Kotlin and unit-tested. It is consulted only at natural stops after a result, never during play, never after a rewarded ad within the cooldown, never in the first three completed runs, and not more than once per three runs.

Tapsell adapters:

- `Tapsell.requestRewardedAd(zoneId, listener)` → cache one ad id.
- `Tapsell.showRewardedAd(adId, activity, AdStateListener.Rewarded)` → reward only in `onRewarded`.
- `Tapsell.requestInterstitialAd` / `showInterstitialAd` similarly.
- `Tapsell.setUserConsent(context, personalized)` is applied on resume and after initialization.
- Initialization is automatic through the SDK's manifest provider using `ir.tapsell.mediation.APPLICATION_KEY`.

All SDK calls are wrapped in `runCatching`/`try` so an ad failure never crashes the game or blocks navigation. A failed reward callback never grants coins.

### 3.8 Sound

Five original WAV files are generated by `tools/generate_sounds.py` and played through `SoundPlayer` with Android `SoundPool`. Failure to load a sound is non-fatal.

## 4. Build and dependency compatibility

Pinned deliberately:

```text
Gradle 8.14.7, AGP 8.13.2, Kotlin 2.4.21, JDK 17
compileSdk/targetSdk 36, minSdk 24
Compose BOM 2025.12.01 → Compose 1.10.0, Material3 1.4.0
core-ktx 1.17.0, activity-compose 1.12.4, lifecycle 2.10.0
kotlinx-coroutines 1.10.2, kotlinx-serialization-json 1.13.0
Tapsell Mediation 1.3.0 + legacy adapter 1.3.0
```

Newer Compose BOMs required AGP 9.1 / API 37 in this environment, so the newest line compatible with AGP 8.13.2 and compileSdk 36 was chosen. Lint dependency-version warnings are therefore intentional.

Release build enables R8 and resource shrinking. R8 emits repeated Kotlin-metadata parsing warnings but completes; this is a tooling caveat, not a compile failure. Release APK is unsigned unless `keystore.properties` exists.

## 5. Error handling and data integrity

- Blank ad configuration is a supported state, not a crash path.
- A corrupt save is reported in the UI; the game falls back to backup or a new save.
- A newer save format is never overwritten.
- Economy operations are idempotent and never allow negative balances.
- Input lock and request ids prevent double-tap duplication.
- Continue is offered only when the engine can prove a rescue plan; the ad path requires the SDK reward callback.
- No reward is fabricated in release when ads are unavailable.

## 6. Testing strategy

- Engine tests are pure JVM and cover rules, scoring, generation, catalog replay, persistence, daily seed and economy.
- App unit tests cover the pure interstitial policy and Persian/date utilities.
- No instrumentation or Compose UI tests exist. No emulator/device was available in this environment, so UI, gestures, lifecycle, SDK behavior and on-device performance remain unverified.

See `TEST_REPORT.md` for exact commands, counts and the requirement-to-test mapping.

## 7. Known limits

- Portrait orientation is intentional for the drag layout; Android 16 large-screen behavior may ignore it.
- Ads are implemented against the documented Tapsell 1.3 API but real ad delivery is untested.
- No release keystore was created, by request.
- No screenshots or store assets were generated.
- There is no crash reporting or analytics; debugging release issues relies on logcat.
