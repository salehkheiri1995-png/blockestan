# Game Balance

All values below live in `engine/src/main/kotlin/ir/blockestan/game/core/engine/GameBalanceConfig.kt`. The UI, engine and economy read them from there; changing a number does not require touching Compose code.

## 1. Core scoring

| Constant | Value | Meaning |
|---|---:|---|
| `POINTS_PER_PLACED_CELL` | 5 | Paid for every cell of the placed piece |
| `POINTS_PER_LINE` | 100 | Paid per cleared row or column |
| `MULTI_LINE_BONUS_PER_EXTRA_LINE` | 75 | Paid for each cleared line after the first |
| `COMBO_MULTIPLIER_STEP` | 0.25 | Added to the line multiplier per consecutive scoring move |
| `MAX_COMBO` | 8 | Combo counter cap |
| `MAX_COMBO_MULTIPLIER` | 2.0 | Multiplier cap |

Exact formula used by `GameSession`:

```text
newCombo   = lines > 0 ? min(previousCombo + 1, 8) : 0
multiplier = lines > 0 ? min(2.0, 1.0 + (newCombo - 1) * 0.25) : 1.0
linePoints = lines * 100 + max(0, lines - 1) * 75
gain       = pieceCellCount * 5 + round(linePoints * multiplier)
```

Important details:

- The multiplier applies to line points only, not to the 5-per-cell placement points.
- The first scoring move uses `newCombo = 1` and therefore x1.0.
- The eighth and later consecutive scoring moves use x2.0.
- A move that clears no line resets the combo to 0.
- A shared cell of a cleared row and column is removed once, but both lines are paid and counted.
- A multi-line clear pays `100` for the first line and `175` for each additional line before the multiplier.

Examples (no combo):

| Clear | Line points | Notes |
|---|---:|---|
| 1 line | 100 | |
| 2 lines | 275 | 100 + 100 + 75 |
| 3 lines | 450 | 100 + 100 + 100 + 75 + 75 |

With a x2.0 combo, those line points double.

## 2. Economy

Coins are virtual only. Version 1 has no real-money purchase, no accounts, no server wallet and no income claim.

### Sources

| Source | Coins | Rules |
|---|---:|---|
| New player balance | 150 | `STARTING_COINS` |
| First completion of each campaign level | 30 | Once per level id, ever; replays pay nothing |
| Rewarded ad | 40 | Explicit user action, one valid SDK reward callback, idempotent request id |
| Daily challenge | 20 | Best score on the local day ≥ 250, once per local day key |

### Sinks

| Sink | Coins | Rules |
|---|---:|---|
| Undo | 50 | Once per move; the engine must have an undo snapshot |
| Swap unused tray pieces | 70 | Only unused slots are replaced |
| Hammer 3×3 | 90 | Must intersect the board and clear at least one occupied cell |
| Continue after loss | 100 | Once per run, only when a valid rescue is provable |
| Theme: Purple Night | 250 | Permanent local unlock |
| Theme: Sunny | 350 | Permanent local unlock |
| Theme: Minimal Light | 450 | Permanent local unlock |

The default Turquoise theme is free.

### Integrity rules

- Every mutation takes a request id; repeated callbacks or double taps resolve to `Duplicate` and do not move coins.
- Spending checks the current balance before writing; a failed purchase leaves the save untouched and the balance cannot go negative.
- First-win rewards track `firstWinClaimed` independently of request ids, so restoring an old save cannot mint the same level reward again.
- Daily rewards track `(dayKey, rewardClaimed)` and use `daily-$dayKey` as the request id.
- Booster charges are refunded only when the engine rejects the action, using a separate refund request id. Ads and purchases never refund automatically.
- The transaction log and id sets are capped; sanitization clamps corrupt or negative values on load and write.

### Economy pacing

The starting 150 coins allow one continue plus one undo, or one hammer plus one undo, or three undos. A first-win reward (30) does not buy a booster by itself; a rewarded ad (40) plus a first win (30) reaches the 70-coin swap price but not the 90-coin hammer or the 100-coin continue. This is intentional: boosters are optional relief, not the primary way to progress, and the game never gates a level behind a purchase.

There is no energy system, no timer and no paywall. A player can finish all 60 levels without watching a single ad.

## 3. Campaign levels

| Property | Value |
|---|---|
| Total levels | 60 |
| Difficulty split | 15 EASY, 25 NORMAL, 20 HARD |
| Reference moves total | 603 |
| Reference moves per level | 6–15 |
| Move limits | 9–18 |
| Authored trays per level | 2–5 (each tray has exactly 3 pieces) |
| Average initial blocked cells | 11.4 of 64 |
| Target cells per level | 8 |
| Star thresholds | 2★ and 3★ per level, authored relative to the reference score |
| Goal types | SCORE, LINES, TARGET_CELLS; at least one goal per level |

Every reference solution was replayed through the production `GameSession` in `LevelValidator`; the tests assert a win, no remaining targets, a score above zero, at most 16 moves and 1–3 stars for all 60 levels. Levels are data-only: adding or editing a level does not require engine code changes, but a new level must pass `validateStatic` and reference replay before release.

Difficulty progression is expressed through:

- the number and placement of pre-filled blocked cells;
- the shape mix in authored trays (EASY favors singles/dominoes/3-lines; HARD favors 4-cell, T, S and Z shapes);
- tighter move limits;
- higher score/line goals.

## 4. Piece generation weights

`GameBalanceConfig.shapeWeights` maps difficulty to shape weights. Weights are relative, not percentages.

| Shape family | EASY | NORMAL | HARD |
|---|---:|---:|---:|
| Single | 18 | 7 | 2 |
| Domino (H/V, each) | 16 | 11 | 5 |
| 3-line (H/V, each) | 12 | 11 | 8 |
| 2×2 square | 12 | 10 | 8 |
| L3 (4 rotations, each) | 8 | 7 | 6 |
| 4-line (H/V, each) | 5 | 9 | 11 |
| 2×3 / 3×2 (each) | 4 | 7 | 9 |
| L4 (4 rotations, each) | 2 | 6 | 8 |
| T4 (4 rotations, each) | 2 | 5 | 8 |
| S4 / Z4 | 0 | 4 | 5 |

Generation uses only the run seed, RNG state and difficulty. It never consults coins, ad history, purchases, level number, score, or whether the player is about to lose. There is no adaptive difficulty and no "pay to get better pieces".

## 5. Game-over and continue

A run is lost only when:

1. the tray has been refilled after a placement, and
2. the actual remaining pieces have no legal placement on the current board.

For campaign levels, reaching the authored move limit after a move also ends the run. The engine checks the real tray, not a heuristic.

Continue is available at most once per run. The engine's `rescuePlan()` scans candidate 3×3 hammer regions and only returns a plan if clearing that region provably creates a legal placement for a remaining piece. If no plan exists, the UI does not offer a coin or ad continue. Continue via ad requires the SDK reward callback; closing without a reward does not resume the run.

## 6. Daily challenge

| Constant | Value |
|---|---:|
| `DAILY_ALGORITHM_VERSION` | 1 |
| `DAILY_REWARD_SCORE` | 250 |
| `DAILY_REWARD_COINS` | 20 |

The seed is `FNV-1a64("blockestan-daily-v1-<local yyyy-MM-dd>")` finalized with SplitMix64. The challenge is fully offline. Only the best score of the day is stored. A below-threshold run does not consume the day's reward; a later qualifying run can claim it once. Moving the device clock can select a different day key, but each key pays at most once and no real value or ranking is affected.

## 7. Ad policy

Product rules are constants; network fill is outside the app's control.

| Constant | Value |
|---|---:|
| `INTERSTITIAL_FIRST_RUNS_WITHOUT_ADS` | 3 |
| `INTERSTITIAL_EVERY_N_RUNS` | 3 |
| `INTERSTITIAL_MIN_INTERVAL_SECONDS` | 180 |
| `INTERSTITIAL_AFTER_REWARDED_COOLDOWN_SECONDS` | 120 |

`InterstitialPolicy.shouldShow(runsFinished, now, lastInterstitialAt, lastRewardedAt)` returns true only when all hold:

```text
runsFinished > 3
(runsFinished - 1) % 3 == 0
now - lastInterstitialAt >= 180s   (if a previous one exists)
now - lastRewardedAt     >= 120s   (if a reward happened)
```

Interstitials are only considered at natural stops after a result screen action, never during a run, never before the first three completed runs, and never immediately after a rewarded ad. If the ad is not loaded or fails, navigation continues immediately. There are no banners and no app-open ads in v1.

Rewarded ads:

- only after an explicit tap on a clearly labelled action;
- only rewarded ads; no forced view;
- coins (40) or a proven continue;
- one reward per showing, guarded by the SDK callback, a one-shot local flag and an idempotent request id;
- unavailable in release when not configured, with no simulated reward.

## 8. Tuning guidance

- Increase `STARTING_COINS` only if first-session booster usage should be more generous; it does not affect level solvability.
- Booster prices are intentionally above a single first-win reward. Lowering them makes boosters a routine part of every level; raising them makes them near-decorative.
- `POINTS_PER_LINE` dominates early scores; changing it requires regenerating star thresholds and re-verifying all 60 reference solutions.
- `MAX_COMBO_MULTIPLIER` above 2.0 would make long combo chains dwarf level goals. If raised, re-author the 2★/3★ thresholds.
- Shape weights are fairness-sensitive. Any change requires rerunning `LevelCatalogTest` and a fresh reference-solution verification for authored levels; generated classic/daily runs should also be smoke-tested for dead boards.
- Interstitial limits are product policy, not a revenue optimization. Do not lower the 3-run or 180-second floors without an explicit product decision; the app currently treats them as hard rules.
