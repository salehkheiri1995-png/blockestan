# Test Report

## 1. Summary

| Suite | Location | Tests | Failures | Errors | Skipped | Result |
|---|---|---:|---:|---:|---:|---|
| Engine (JVM) | `engine/src/test` | 48 | 0 | 0 | 0 | PASS |
| App unit tests (JVM) | `app/src/test` | 11 | 0 | 0 | 0 | PASS |
| App instrumentation | `app/src/androidTest` | — | — | — | — | NOT PRESENT |
| Manual on-device | device/emulator | — | — | — | — | BLOCKED |

**Total automated JVM tests: 59, all passing.**

Executed on 2026-11-16 in this environment:

```powershell
.\gradlew.bat :engine:test :app:testDebugUnitTest --console=plain
# BUILD SUCCESSFUL
```

JUnit XML totals were read from:

- `engine/build/test-results/test/TEST-*.xml` → 48 tests, 0 failures, 0 errors, 0 skipped
- `app/build/test-results/testDebugUnitTest/TEST-*.xml` → 11 tests, 0 failures, 0 errors, 0 skipped

## 2. Per-class breakdown

### Engine — 48

| Class | Tests | What it covers |
|---|---:|---|
| `PlacementRulesTest` | 22 | placement, clearing, scoring, combo, game over, refill, deterministic generation, undo, swap, hammer, rescue, geometry |
| `EconomyTest` | 12 | starting balance, insufficient funds, duplicate spend, duplicate reward, blank id, first-win, daily, theme, sanitization |
| `LevelCatalogTest` | 6 | 60-level shape, difficulty split, reference replay, opening legality, goals, illegal prefix |
| `SaveCodecTest` | 5 | round trip, RNG continuation, corrupt JSON, newer version, sanitization |
| `DailySeedTest` | 3 | same-day stability, day separation, algorithm version |
| **Total** | **48** | |

### App — 11

| Class | Tests | What it covers |
|---|---:|---|
| `InterstitialPolicyTest` | 6 | first three runs, every third run, interval, rewarded cooldown, non-positive timestamps, no history |
| `UtilTest` | 5 | Persian digits, grouping, clock padding, local date key stability, local-vs-UTC |
| **Total** | **11** | |

## 3. Requirement-to-test mapping (20 required cases)

| # | Required case | Tests that cover it | Status |
|---:|---|---|---|
| 1 | Valid placement only on empty in-bounds cells | `placing_piece_marks_cells_and_scores_five_per_cell`, `placement_outside_the_board_is_rejected`, `placement_on_an_occupied_cell_is_rejected`, `empty_tray_slot_is_rejected` | PASS |
| 2 | Reject out-of-bounds placement | `placement_outside_the_board_is_rejected` | PASS |
| 3 | Reject overlap with occupied cell | `placement_on_an_occupied_cell_is_rejected` | PASS |
| 4 | Complete a row and clear it | `completed_row_is_cleared_and_pays_line_points` | PASS |
| 5 | Complete a column and clear it | `completed_column_is_cleared` | PASS |
| 6 | Simultaneous row + column, shared cell counted once | `shared_cell_of_row_and_column_is_counted_once` (asserts 15 unique cells and both lines) | PASS |
| 7 | Scoring: 5/cell, 100/line, multi-line bonus | `placing_piece_marks_cells_and_scores_five_per_cell`, `completed_row_is_cleared_and_pays_line_points`, `shared_cell_of_row_and_column_is_counted_once` | PASS |
| 8 | Combo multiplier applied and capped | `combo_multiplier_is_applied_and_capped`, `combo_resets_when_a_move_clears_no_line` | PASS |
| 9 | Game over only after refill, based on actual pieces | `game_over_is_only_declared_after_refill_and_with_actual_pieces`, `unresolved_tray_without_any_fitting_piece_ends_the_run`, `move_limit_loss_is_reported_after_the_move`, `placing_after_the_run_ended_is_rejected` | PASS |
| 10 | Generation deterministic and independent of purchases/ads/coins | `deterministic_generator_reproduces_the_same_tray_for_the_same_seed`; generator API has no economy/ad inputs (code isolation) | PASS (fairness by construction + determinism test) |
| 11 | Autosave/resume preserves active run and RNG | `save_round_trip_preserves_every_field_including_the_active_run`, `save_restore_continues_with_the_same_rng_sequence` | PASS |
| 12 | All 60 levels replay to a win | `every_reference_solution_replays_to_a_win` (60/60), plus catalog structure and opening legality | PASS |
| 13 | Daily seed stable and reward once per day | `DailySeedTest` (3), `daily_reward_is_paid_once_per_local_day_key`, `a_daily_result_below_the_threshold_still_keeps_the_reward_available`, `dateKeyIsStableForTheSameInstantAndMatchesLocalCalendarDay` | PASS |
| 14 | Undo restores exact pre-move state, once | `undo_restores_the_exact_pre_placement_state_once` | PASS |
| 15 | Swap replaces only unused tray slots | `swap_replaces_only_unconsumed_slots` | PASS |
| 16 | Hammer clears a clipped 3×3 and rejects empty region | `hammer_clears_a_clipped_3x3_and_keeps_targets`, `hammer_on_an_empty_region_is_not_applicable` | PASS |
| 17 | Continue only with proven rescue; one per run | `rescue_plan_exists_only_when_it_provably_restores_a_move`, `rescue_rejects_a_plan_that_does_not_match_the_board`, `no_rescue_is_offered_after_a_continue_was_used` | PASS |
| 18 | No negative coin balance | `a_purchase_never_makes_the_balance_negative`, `sanitized_save_clamps_corrupt_values` | PASS |
| 19 | Duplicate reward prevention | `the_same_rewarded_ad_callback_is_granted_exactly_once`, `first_level_win_pays_once_even_for_replays`, `first_level_win_reward_is_not_paid_twice_through_a_duplicate_request`, `daily_reward_is_paid_once_per_local_day_key` | PASS |
| 20 | Duplicate spend prevention | `the_same_spend_request_is_charged_exactly_once`, `a_blank_request_id_is_rejected`, `theme_purchase_charges_once_and_unlocks_the_theme` | PASS |

## 4. Level verification detail

`every_reference_solution_replays_to_a_win` iterates all 60 levels and uses the production `GameSession` to replay each `referenceSolution`. Assertions per level:

- result is `WON`;
- moves used ≤ 16 (and ≤ authored move limit by validator construction);
- score > 0;
- remaining targets = 0;
- stars in 1..3.

Catalog facts verified:

- exactly 60 levels, ids 1..60, unique titles;
- 15 EASY / 25 NORMAL / 20 HARD;
- 603 total reference moves, 6–15 per level;
- move limits 9–18;
- no level starts already won;
- every opening session has a legal move and exactly three tray slots.

The authoring tool is `engine/src/test/kotlin/ir/blockestan/game/tools/LevelGenerator.kt`; `levels.json` is 260,550 bytes and is packaged into the APK.

## 5. Build and lint verification

| Command | Result | Artifact |
|---|---|---|
| `:app:assembleDebug` | SUCCESS | `app/build/outputs/apk/debug/app-debug.apk` (20,393,443 bytes) |
| `:app:assembleRelease` | SUCCESS, unsigned | `app/build/outputs/apk/release/app-release-unsigned.apk` (5,665,244 bytes) |
| `:app:lintDebug` | 0 errors, 11 warnings | `app/build/reports/lint-results-debug.txt` |
| `:engine:test` | 48/48 | JUnit XML |
| `:app:testDebugUnitTest` | 11/11 | JUnit XML |

Lint warnings (all non-blocking):

- 7 dependency-version suggestions (`GradleDependency` / `NewerVersionAvailable`) — versions are pinned for AGP 8.13.2 / compileSdk 36 compatibility.
- 1 `OldTargetApi` — targetSdk 36 is the newest supported by the pinned toolchain in this environment; the warning text is about an even newer platform.
- 1 `LockedOrientationActivity` and 1 `DiscouragedApi` for `screenOrientation="portrait"` — intentional layout decision; Android 16 may ignore it on large screens.

Release BuildConfig was inspected after building:

```text
ADS_CONFIGURED = false
TAPSELL_APP_ID = ""
TAPSELL_REWARDED_ZONE_ID = ""
TAPSELL_INTERSTITIAL_ZONE_ID = ""
```

Merged release manifest contains `ir.tapsell.mediation.APPLICATION_KEY` with an empty value.

## 6. Ads verification status

### Implemented and reviewed

- Build-type provider selection in `AdsController`.
- Debug-only simulated rewarded provider, labelled in UI; unreachable in release.
- Release with blank config uses `UnavailableRewardedAds` and never grants a reward.
- Tapsell 1.3 API calls match the official documented signatures.
- Reward is granted only from `AdStateListener.Rewarded.onRewarded`.
- One-shot local flag plus idempotent request id in `Economy`.
- Interstitial policy unit-tested (6 cases).
- All SDK calls wrapped to avoid crashing the game on ad failure.

### Static inspection only

- Tapsell `MediatorInitializer.preInitialize` throws `TapsellManifestException` for a blank/invalid manifest app key.
- Tapsell core `Initializer.preInitializeSingleComponent` catches `Exception` and logs “Could not initialize Tapsell”.
- Therefore blank config is expected to be non-fatal, but **this was not executed on a device**.

### Not tested

- Real Tapsell app id / zone ids and network fill.
- Reward callback timing against the real SDK.
- Interstitial showing/closing and navigation on a real ad.
- Consent behavior (`setUserConsent`) against a real SDK.
- Cold-start initialization timing and preload race.

## 7. Not tested / blocked

| Area | Reason | Required before release |
|---|---|---|
| App launch on device | No emulator image or physical device available | Install debug APK on API 24 and API 36 devices |
| Drag/drop gestures | Requires UI runtime | Manual test: valid, invalid, cancel, RTL, edge rows/columns |
| Compose UI tests | No `androidTest` sources; no device | Add and run instrumentation tests if desired |
| Sound/vibration | Requires device | Verify toggles and lifecycle |
| Safe insets / small phone / tablet | Requires device | Test 320dp-wide phone and tablet |
| Save recovery after process death | Requires device | Kill process mid-run, relaunch |
| Real ads | Credentials + network + device | Use test app id/zones, then production ids |
| Release APK install | Unsigned | Sign with publisher keystore |
| R8 release runtime | Only compile-verified; metadata warnings | Install signed release, exercise all screens |
| Screenshots/store assets | No device | Capture real screenshots |

## 8. Reproducing

```powershell
# clean rerun of JVM tests
.\gradlew.bat :engine:test --rerun-tasks
.\gradlew.bat :app:testDebugUnitTest --rerun-tasks

# build + lint
.\gradlew.bat :app:assembleDebug :app:lintDebug
```

Test reports:

```text
engine/build/reports/tests/test/index.html
app/build/reports/tests/testDebugUnitTest/index.html
app/build/reports/lint-results-debug.html
```

## 9. Honest conclusion

The rules, scoring, level catalog, persistence codec, economy idempotency, daily seed and interstitial policy are covered by passing JVM tests. The app compiles and both debug and unsigned release APKs build. The game has **not** been run on an Android device or emulator in this environment, so UI behavior, gestures, lifecycle, real Tapsell ads and release runtime are implemented but unverified. No test result in this report was inferred or fabricated.
