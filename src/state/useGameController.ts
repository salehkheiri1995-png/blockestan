import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSaveFromStorage, writeSaveToStorage } from '../data/saveStore';
import {
  chapterForLevel,
  isChapterCompleted,
  STORY_CHAPTERS,
  StoryChapter,
} from '../data/story';
import { BazaarProduct, GameBalanceConfig } from '../engine/balance';
import { DailySeed } from '../engine/dailySeed';
import { Economy } from '../engine/economy';
import { GameSession } from '../engine/gameSession';
import { LevelCatalog } from '../engine/levelCatalog';
import { LevelDefinition } from '../engine/levelModels';
import {
  Cell,
  GameMode,
  GameState,
  indexOf,
  PieceShape,
  PlacementError,
  RescuePlan,
  RunStatus,
} from '../engine/models';
import { AppSaveData, CoinReason, sanitizeSaveData } from '../engine/persistence';
import { isNativeBazaarAvailable, launchNativeBazaarPurchase } from '../services/bazaarBilling';
import { isNativeAdsAvailable, showRewardedAd } from '../services/tapsellAds';
import { faDigits, newRequestId, todayDayKey } from '../utils/fa';
import { triggerHaptic } from '../utils/haptics';
import { soundPlayer } from '../utils/sound';

export enum Screen {
  HOME = 'HOME',
  LEVELS = 'LEVELS',
  GAME = 'GAME',
  SHOP = 'SHOP',
  SETTINGS = 'SETTINGS',
  PRIVACY = 'PRIVACY',
}

export enum RewardPurpose {
  COINS = 'COINS',
  CONTINUE = 'CONTINUE',
}

export interface DragUi {
  slot: number;
  shape: PieceShape;
  color: number;
  pointerX: number;
  pointerY: number;
  grabCell: Cell;
  targetRow: number;
  targetCol: number;
  valid: boolean;
}

export interface ResultUi {
  mode: GameMode;
  won: boolean;
  score: number;
  lines: number;
  stars: number;
  coinsEarned: number;
  gemsEarned: number;
  chapterCompletedTitle: string | null;
  newPersonalBest: boolean;
  levelId: number | null;
  canContinue: boolean;
  dailyReward: boolean;
  nextLevelAvailable: boolean;
}

export interface AdUi {
  showing: boolean;
  simulated: boolean;
  purpose: RewardPurpose | null;
  message: string | null;
}

export interface PlacementFx {
  id: number;
  placedIndices: number[];
  clearedCells: number[];
  gainedScore: number;
  lines: number;
  combo: number;
}

export interface GameUiState {
  save: AppSaveData;
  screen: Screen;
  session: GameState | null;
  mode: GameMode | null;
  level: LevelDefinition | null;
  dayKey: string | null;
  inputLocked: boolean;
  drag: DragUi | null;
  selectedSlot: number | null;
  hammerMode: boolean;
  result: ResultUi | null;
  pendingRescue: RescuePlan | null;
  snack: string | null;
  ad: AdUi;
  lastCleared: number[];
  fx: PlacementFx | null;
  adStatusLabel: string;
  rewardedConfigured: boolean;
  rewardedSimulated: boolean;
  activeStoryModal: StoryChapter | null;
  pendingBazaarProduct: BazaarProduct | null;
  bazaarProcessing: boolean;
  nativeBazaarConnected: boolean;
}

function messageForPlacementError(reason: PlacementError): string {
  switch (reason) {
    case PlacementError.NOT_PLAYING:
      return 'بازی در این وضعیت قابل حرکت نیست.';
    case PlacementError.EMPTY_SLOT:
      return 'این خانه خالی است.';
    case PlacementError.OUT_OF_BOUNDS:
      return 'بیرون از زمین بازی است.';
    case PlacementError.OVERLAP:
      return 'این خانه‌ها پر هستند.';
    case PlacementError.NO_LEGAL_MOVE:
      return 'حرکت قانونی وجود ندارد.';
  }
}

function starsForLevel(level: LevelDefinition, score: number): number {
  if (score >= level.starThresholds.threeStars) return 3;
  if (score >= level.starThresholds.twoStars) return 2;
  return 1;
}

export function useGameController() {
  const initialReportRef = useRef(loadSaveFromStorage());
  const saveRef = useRef<AppSaveData>(initialReportRef.current.data);
  const sessionRef = useRef<GameSession | null>(null);
  const finalizedRef = useRef(false);
  const adTimersRef = useRef<number[]>([]);
  const fxSeqRef = useRef(0);

  const [ui, setUi] = useState<GameUiState>(() => {
    const report = initialReportRef.current;
    let initialSnack: string | null = report.error;
    if (report.recoveredFromBackup) {
      initialSnack = 'ذخیره از نسخهٔ پشتیبان بازیابی شد.';
    }
    return {
      save: report.data,
      screen: Screen.HOME,
      session: null,
      mode: null,
      level: null,
      dayKey: null,
      inputLocked: false,
      drag: null,
      selectedSlot: null,
      hammerMode: false,
      result: null,
      pendingRescue: null,
      snack: initialSnack,
      ad: { showing: false, simulated: false, purpose: null, message: null },
      lastCleared: [],
      fx: null,
      adStatusLabel: isNativeAdsAvailable()
        ? 'تبلیغات تپسل فعال است (بنر + ویدیوی جایزه‌دار)'
        : 'تبلیغ شبیه‌سازی‌شده (نسخهٔ وب، بدون درآمد)',
      rewardedConfigured: true,
      rewardedSimulated: !isNativeAdsAvailable(),
      activeStoryModal: null,
      pendingBazaarProduct: null,
      bazaarProcessing: false,
      nativeBazaarConnected: isNativeBazaarAvailable(),
    };
  });

  const uiRef = useRef(ui);
  uiRef.current = ui;

  const commitSave = useCallback((updater: (prev: AppSaveData) => AppSaveData): AppSaveData => {
    const next = sanitizeSaveData(updater(saveRef.current));
    saveRef.current = next;
    writeSaveToStorage(next);
    setUi((prev) => ({ ...prev, save: next }));
    return next;
  }, []);

  const snack = useCallback((message: string) => {
    setUi((prev) => ({ ...prev, snack: message }));
  }, []);

  const dismissSnack = useCallback(() => {
    setUi((prev) => ({ ...prev, snack: null }));
  }, []);

  useEffect(() => {
    if (!ui.snack) return;
    const id = window.setTimeout(() => {
      setUi((prev) => ({ ...prev, snack: null }));
    }, 3500);
    return () => window.clearTimeout(id);
  }, [ui.snack]);

  useEffect(() => {
    return () => {
      adTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const autosave = useCallback(
    (activeSession: GameSession, mode: GameMode, level: LevelDefinition | null, dayKey: string | null) => {
      if (activeSession.state.status !== RunStatus.PLAYING) return;
      commitSave((prev) => ({
        ...prev,
        activeRun: {
          mode,
          levelId: level?.id ?? null,
          dayKey,
          state: activeSession.state,
        },
      }));
    },
    [commitSave]
  );

  const openStoryChapter = useCallback((chapterId: number) => {
    const chapter = STORY_CHAPTERS.find((c) => c.id === chapterId) ?? STORY_CHAPTERS[0];
    setUi((prev) => ({ ...prev, activeStoryModal: chapter }));
  }, []);

  const dismissStoryModal = useCallback(() => {
    const current = uiRef.current.activeStoryModal;
    if (current) {
      commitSave((s) =>
        s.seenStoryChapters.includes(current.id)
          ? s
          : { ...s, seenStoryChapters: [...s.seenStoryChapters, current.id] }
      );
    }
    setUi((prev) => ({ ...prev, activeStoryModal: null }));
  }, [commitSave]);

  const finalizeRun = useCallback(
    (won: boolean): ResultUi => {
      const active = sessionRef.current;
      const cur = uiRef.current;
      const mode = cur.mode ?? GameMode.CLASSIC;
      const level = cur.level;
      if (!active) {
        return {
          mode,
          won,
          score: 0,
          lines: 0,
          stars: 0,
          coinsEarned: 0,
          gemsEarned: 0,
          chapterCompletedTitle: null,
          newPersonalBest: false,
          levelId: level?.id ?? null,
          canContinue: false,
          dailyReward: false,
          nextLevelAvailable: false,
        };
      }
      if (finalizedRef.current && cur.result) {
        return cur.result;
      }
      finalizedRef.current = true;

      const state = active.state;
      let coinsEarned = 0;
      let gemsEarned = 0;
      let chapterCompletedTitle: string | null = null;
      let newBest = false;
      const stars = won && level ? starsForLevel(level, state.score) : 0;
      const now = Date.now();

      if (mode === GameMode.LEVEL && level) {
        commitSave((save) => {
          let updated: AppSaveData = {
            ...save,
            unlockedLevel: won
              ? Math.max(save.unlockedLevel, Math.min(level.id + 1, GameBalanceConfig.TOTAL_LEVELS))
              : save.unlockedLevel,
            levelStars: won
              ? { ...save.levelStars, [level.id]: Math.max(save.levelStars[level.id] ?? 0, stars) }
              : save.levelStars,
            stats: {
              ...save.stats,
              runsFinished: save.stats.runsFinished + 1,
              levelWins: save.stats.levelWins + (won ? 1 : 0),
            },
            activeRun: null,
          };

          if (won && !updated.firstWinClaimed.includes(level.id)) {
            const requestId = `firstwin-${level.id}-${state.seed}`;
            const claim = Economy.claimFirstLevelWin(updated, level.id, requestId, now);
            if (claim.type === 'Applied') {
              coinsEarned += GameBalanceConfig.FIRST_LEVEL_WIN_COINS;
              updated = claim.save;
            }
          }

          if (won && stars === 3 && !updated.threeStarGemClaimed.includes(level.id)) {
            const gemReq = `threestar-gem-${level.id}`;
            const gemClaim = Economy.claimThreeStarGem(updated, level.id, gemReq, now);
            if (gemClaim.type === 'Applied') {
              gemsEarned += GameBalanceConfig.LEVEL_THREE_STAR_BONUS_GEMS;
              updated = gemClaim.save;
            }
          }

          if (won) {
            const chapter = chapterForLevel(level.id);
            if (
              !updated.claimedStoryRewards.includes(chapter.id) &&
              isChapterCompleted(chapter, updated.levelStars)
            ) {
              const chClaim = Economy.claimStoryChapterReward(
                updated,
                chapter.id,
                `chapter-reward-${chapter.id}`,
                now
              );
              if (chClaim.type === 'Applied') {
                coinsEarned += GameBalanceConfig.CHAPTER_COMPLETE_COINS;
                gemsEarned += GameBalanceConfig.CHAPTER_COMPLETE_GEMS;
                chapterCompletedTitle = chapter.title;
                updated = chClaim.save;
              }
            }
          }

          return updated;
        });
      } else if (mode === GameMode.CLASSIC) {
        newBest = state.score > saveRef.current.classicBest;
        commitSave((save) => ({
          ...save,
          classicBest: Math.max(save.classicBest, state.score),
          stats: {
            ...save.stats,
            runsFinished: save.stats.runsFinished + 1,
            classicRuns: save.stats.classicRuns + 1,
          },
          activeRun: null,
        }));
      } else if (mode === GameMode.DAILY) {
        const key = cur.dayKey ?? todayDayKey();
        commitSave((save) => {
          let updated = Economy.recordDailyResult(
            {
              ...save,
              stats: { ...save.stats, runsFinished: save.stats.runsFinished + 1 },
              activeRun: null,
            },
            key,
            state.score
          );
          if (state.score >= GameBalanceConfig.DAILY_REWARD_SCORE) {
            const claim = Economy.claimDailyReward(updated, key, `daily-${key}`, now);
            if (claim.type === 'Applied') {
              coinsEarned = GameBalanceConfig.DAILY_REWARD_COINS;
              updated = claim.save;
            }
          }
          return updated;
        });
      }

      if (coinsEarned > 0 || gemsEarned > 0) {
        soundPlayer.playCoin(saveRef.current.soundEnabled);
      }
      if (won) {
        soundPlayer.playWin(saveRef.current.soundEnabled);
      }

      const nextLevelAvailable =
        won &&
        level !== null &&
        level.id < GameBalanceConfig.TOTAL_LEVELS &&
        saveRef.current.unlockedLevel > level.id;

      return {
        mode,
        won,
        score: state.score,
        lines: state.linesCleared,
        stars,
        coinsEarned,
        gemsEarned,
        chapterCompletedTitle,
        newPersonalBest: newBest,
        levelId: level?.id ?? null,
        canContinue: false,
        dailyReward: mode === GameMode.DAILY && coinsEarned > 0,
        nextLevelAvailable,
      };
    },
    [commitSave]
  );

  const begin = useCallback(
    (
      newSession: GameSession,
      mode: GameMode,
      level: LevelDefinition | null,
      dayKey: string | null,
      introStory: StoryChapter | null = null
    ) => {
      sessionRef.current = newSession;
      finalizedRef.current = false;
      setUi((prev) => ({
        ...prev,
        screen: Screen.GAME,
        session: newSession.state,
        mode,
        level,
        dayKey,
        result: null,
        pendingRescue: null,
        drag: null,
        selectedSlot: null,
        hammerMode: false,
        inputLocked: false,
        lastCleared: [],
        fx: null,
        snack: null,
        activeStoryModal: introStory,
      }));
      autosave(newSession, mode, level, dayKey);
    },
    [autosave]
  );

  const goHome = useCallback(() => {
    const cur = uiRef.current;
    if (cur.result && !finalizedRef.current) {
      finalizeRun(false);
    }
    sessionRef.current = null;
    setUi((prev) => ({
      ...prev,
      screen: Screen.HOME,
      drag: null,
      selectedSlot: null,
      hammerMode: false,
      result: null,
      pendingRescue: null,
      snack: null,
    }));
  }, [finalizeRun]);

  const openLevels = useCallback(() => setUi((prev) => ({ ...prev, screen: Screen.LEVELS, snack: null })), []);
  const openShop = useCallback(() => setUi((prev) => ({ ...prev, screen: Screen.SHOP, snack: null })), []);
  const openSettings = useCallback(() => setUi((prev) => ({ ...prev, screen: Screen.SETTINGS, snack: null })), []);
  const openPrivacy = useCallback(() => setUi((prev) => ({ ...prev, screen: Screen.PRIVACY, snack: null })), []);

  const resumeActive = useCallback(() => {
    const active = saveRef.current.activeRun;
    if (!active) {
      snack('بازی نیمه‌تمام ذخیره‌شده‌ای وجود ندارد.');
      return;
    }
    if (active.state.status !== RunStatus.PLAYING) {
      snack('آن بازی تمام شده است.');
      return;
    }
    const level = active.levelId ? (LevelCatalog.byId(active.levelId) ?? null) : null;
    if (active.mode === GameMode.LEVEL && !level) {
      snack('دادهٔ مرحله در دسترس نیست.');
      return;
    }
    const restored = GameSession.restore(active.mode, level, active.state);
    sessionRef.current = restored;
    finalizedRef.current = false;
    setUi((prev) => ({
      ...prev,
      screen: Screen.GAME,
      session: restored.state,
      mode: active.mode,
      level,
      dayKey: active.dayKey,
      result: null,
      pendingRescue: null,
      drag: null,
      selectedSlot: null,
      hammerMode: false,
      inputLocked: false,
      lastCleared: [],
      fx: null,
      snack: null,
    }));
  }, [snack]);

  const startClassic = useCallback(() => {
    const active = saveRef.current.activeRun;
    if (active && active.mode === GameMode.CLASSIC && active.state.status === RunStatus.PLAYING) {
      resumeActive();
      return;
    }
    const seed = BigInt(Date.now()) * 1000003n ^ BigInt(Math.floor(Math.random() * 1e9));
    begin(GameSession.newClassic(seed), GameMode.CLASSIC, null, null);
  }, [begin, resumeActive]);

  const startNewClassic = useCallback(() => {
    const seed = BigInt(Date.now()) * 1000003n ^ BigInt(Math.floor(Math.random() * 1e9));
    begin(GameSession.newClassic(seed), GameMode.CLASSIC, null, null);
  }, [begin]);

  const startLevel = useCallback(
    (levelId: number) => {
      if (levelId > saveRef.current.unlockedLevel) {
        snack('این مرحله هنوز باز نشده است.');
        return;
      }
      const level = LevelCatalog.byId(levelId);
      if (!level) {
        snack('مرحله پیدا نشد.');
        return;
      }
      const chapter = chapterForLevel(level.id);
      const shouldShowChapterIntro =
        level.id === chapter.levelFrom && !saveRef.current.seenStoryChapters.includes(chapter.id);
      begin(
        GameSession.newLevel(level),
        GameMode.LEVEL,
        level,
        null,
        shouldShowChapterIntro ? chapter : null
      );
    },
    [begin, snack]
  );

  const startDaily = useCallback(() => {
    const key = todayDayKey();
    if (saveRef.current.daily.dayKey !== key) {
      commitSave((save) =>
        save.daily.dayKey === key ? save : { ...save, daily: { dayKey: key, bestScore: 0, rewardClaimed: false } }
      );
    }
    begin(GameSession.newDaily(DailySeed.seedForDay(key)), GameMode.DAILY, null, key);
  }, [begin, commitSave]);

  const canPlace = useCallback((slot: number, row: number, col: number): boolean => {
    const cur = uiRef.current;
    if (!cur.session || cur.inputLocked || cur.result || cur.session.status !== RunStatus.PLAYING) {
      return false;
    }
    return sessionRef.current?.canPlace(slot, row, col) ?? false;
  }, []);

  const placePiece = useCallback(
    (slot: number, row: number, col: number) => {
      const active = sessionRef.current;
      const cur = uiRef.current;
      if (!active || !cur.session || cur.inputLocked || cur.result || cur.session.status !== RunStatus.PLAYING) {
        return;
      }
      const placedPiece = active.state.tray[slot];
      const placedIndices = placedPiece
        ? placedPiece.shape.cells.map((c) => indexOf(row + c.row, col + c.col))
        : [];
      setUi((prev) => ({ ...prev, inputLocked: true, drag: null, selectedSlot: null, hammerMode: false }));
      const outcome = active.place(slot, row, col);
      if (!outcome.ok) {
        soundPlayer.playInvalid(saveRef.current.soundEnabled);
        triggerHaptic(saveRef.current.vibrationEnabled);
        setUi((prev) => ({
          ...prev,
          inputLocked: false,
          snack: messageForPlacementError(outcome.reason),
        }));
        return;
      }

      soundPlayer.playPlace(saveRef.current.soundEnabled);
      if (outcome.lines > 0) {
        soundPlayer.playClear(saveRef.current.soundEnabled);
        triggerHaptic(saveRef.current.vibrationEnabled);
      }

      const nextState = active.state;
      fxSeqRef.current += 1;
      const fxEvent: PlacementFx = {
        id: fxSeqRef.current,
        placedIndices,
        clearedCells: outcome.clearedCells,
        gainedScore: outcome.gainedScore,
        lines: outcome.lines,
        combo: outcome.combo,
      };
      setUi((prev) => ({
        ...prev,
        session: nextState,
        inputLocked: outcome.status !== RunStatus.PLAYING,
        drag: null,
        selectedSlot: null,
        lastCleared: outcome.clearedCells,
        fx: fxEvent,
      }));

      if (outcome.status === RunStatus.WON) {
        const result = finalizeRun(true);
        setUi((prev) => ({ ...prev, result, pendingRescue: null, inputLocked: true }));
      } else if (outcome.status === RunStatus.LOST) {
        const plan = active.rescuePlan();
        if (!plan) {
          const result = finalizeRun(false);
          setUi((prev) => ({ ...prev, result, pendingRescue: null, inputLocked: true }));
        } else {
          setUi((prev) => ({
            ...prev,
            pendingRescue: plan,
            inputLocked: true,
            result: {
              mode: prev.mode ?? GameMode.CLASSIC,
              won: false,
              score: nextState.score,
              lines: nextState.linesCleared,
              stars: 0,
              coinsEarned: 0,
              gemsEarned: 0,
              chapterCompletedTitle: null,
              newPersonalBest: false,
              levelId: prev.level?.id ?? null,
              canContinue: true,
              dailyReward: false,
              nextLevelAvailable: false,
            },
          }));
        }
      } else if (cur.mode) {
        autosave(active, cur.mode, cur.level, cur.dayKey);
      }
    },
    [autosave, finalizeRun]
  );

  const updateDrag = useCallback((drag: DragUi | null) => {
    setUi((prev) => ({ ...prev, drag }));
  }, []);

  const dropDrag = useCallback(() => {
    const drag = uiRef.current.drag;
    if (!drag) return;
    setUi((prev) => ({ ...prev, drag: null }));
    if (!drag.valid) {
      soundPlayer.playInvalid(saveRef.current.soundEnabled);
      triggerHaptic(saveRef.current.vibrationEnabled);
      snack('این قطعه در اینجا جا نمی‌شود.');
      return;
    }
    placePiece(drag.slot, drag.targetRow, drag.targetCol);
  }, [placePiece, snack]);

  const selectSlot = useCallback((slot: number | null) => {
    setUi((prev) => ({
      ...prev,
      selectedSlot: prev.selectedSlot === slot ? null : slot,
      hammerMode: false,
    }));
  }, []);

  const spendBooster = useCallback(
    (reason: CoinReason, apply: () => ReturnType<GameSession['undo']>) => {
      const active = sessionRef.current;
      const cur = uiRef.current;
      if (!active || !cur.session || cur.inputLocked || cur.result || cur.session.status !== RunStatus.PLAYING) {
        return;
      }
      const cost = Economy.costOf(reason);
      if (cost === null) return;
      if (saveRef.current.coins < cost) {
        snack('سکه کافی نیست! می‌توانی از فروشگاه سکه تهیه کنی یا الماس تبدیل کنی.');
        return;
      }
      const requestId = `booster-${reason.toLowerCase()}-${newRequestId()}`;
      const now = Date.now();
      const spend = Economy.spend(saveRef.current, cost, reason, requestId, now);
      if (spend.type === 'InsufficientFunds') {
        snack('سکه کافی نیست.');
        return;
      }
      if (spend.type !== 'Applied') {
        snack('انجام این کار ممکن نیست.');
        return;
      }

      commitSave(() => spend.save);
      const outcome = apply();
      if (outcome.type === 'Applied') {
        soundPlayer.playClear(saveRef.current.soundEnabled);
        setUi((prev) => ({
          ...prev,
          session: active.state,
          inputLocked: false,
          hammerMode: false,
          drag: null,
          selectedSlot: null,
          lastCleared: outcome.clearedCells,
        }));
        if (cur.mode) autosave(active, cur.mode, cur.level, cur.dayKey);
      } else {
        commitSave((s) => {
          const refund = Economy.grant(s, cost, CoinReason.ADJUST, `refund-${requestId}`, Date.now());
          return refund.type === 'Applied' ? refund.save : s;
        });
        snack('این تقویت‌کننده در این وضعیت قابل استفاده نبود؛ سکه بازگردانده شد.');
      }
    },
    [autosave, commitSave, snack]
  );

  const requestUndo = useCallback(() => {
    const active = sessionRef.current;
    if (!active) return;
    if (!active.state.undo) {
      snack('حرکت قابل بازگشتی وجود ندارد.');
      return;
    }
    spendBooster(CoinReason.UNDO, () => active.undo());
  }, [snack, spendBooster]);

  const requestSwap = useCallback(() => {
    const active = sessionRef.current;
    if (!active) return;
    if (active.state.tray.every((p) => p === null)) {
      snack('قطعه‌ای برای تعویض نمانده است.');
      return;
    }
    spendBooster(CoinReason.SWAP, () => active.swapUnusedPieces());
  }, [snack, spendBooster]);

  const toggleHammer = useCallback(() => {
    const cur = uiRef.current;
    if (!cur.session || cur.inputLocked || cur.result || cur.session.status !== RunStatus.PLAYING) return;
    if (saveRef.current.coins < GameBalanceConfig.HAMMER_COST) {
      snack(`برای چکش به ${faDigits(GameBalanceConfig.HAMMER_COST)} سکه نیاز داری.`);
      return;
    }
    setUi((prev) => ({ ...prev, hammerMode: !prev.hammerMode, drag: null, selectedSlot: null }));
  }, [snack]);

  const hammerAt = useCallback(
    (row: number, col: number) => {
      const active = sessionRef.current;
      if (!active) return;
      const region = active.hammerRegion(row, col);
      if (region.every((idx) => active.state.board[idx] === 0)) {
        soundPlayer.playInvalid(saveRef.current.soundEnabled);
        snack('در این محدوده چیزی برای شکستن نیست.');
        return;
      }
      spendBooster(CoinReason.HAMMER, () => active.useHammer(row, col));
    },
    [snack, spendBooster]
  );

  const resumeAfterContinue = useCallback(
    (active: GameSession) => {
      finalizedRef.current = false;
      const cur = uiRef.current;
      setUi((prev) => ({
        ...prev,
        result: null,
        pendingRescue: null,
        inputLocked: false,
        session: active.state,
        drag: null,
        selectedSlot: null,
        hammerMode: false,
      }));
      if (cur.mode) autosave(active, cur.mode, cur.level, cur.dayKey);
      snack('بازی ادامه یافت.');
    },
    [autosave, snack]
  );

  const continueWithCoins = useCallback(() => {
    const active = sessionRef.current;
    const plan = uiRef.current.pendingRescue;
    if (!active || !plan) return;
    if (saveRef.current.coins < GameBalanceConfig.CONTINUE_COST) {
      snack('سکه کافی نیست.');
      return;
    }
    const requestId = `continue-${newRequestId()}`;
    const spend = Economy.spend(saveRef.current, GameBalanceConfig.CONTINUE_COST, CoinReason.CONTINUE, requestId, Date.now());
    if (spend.type === 'InsufficientFunds') {
      snack('سکه کافی نیست.');
      return;
    }
    if (spend.type !== 'Applied') {
      snack('انجام این کار ممکن نیست.');
      return;
    }
    commitSave(() => spend.save);
    if (active.applyRescue(plan)) {
      resumeAfterContinue(active);
    } else {
      commitSave((s) => {
        const refund = Economy.grant(
          s,
          GameBalanceConfig.CONTINUE_COST,
          CoinReason.ADJUST,
          `refund-${requestId}`,
          Date.now()
        );
        return refund.type === 'Applied' ? refund.save : s;
      });
      snack('ادامه ممکن نبود؛ سکه بازگردانده شد.');
    }
  }, [commitSave, resumeAfterContinue, snack]);

  const continueWithGems = useCallback(() => {
    const active = sessionRef.current;
    const plan = uiRef.current.pendingRescue;
    if (!active || !plan) return;
    if (saveRef.current.gems < GameBalanceConfig.CONTINUE_GEM_COST) {
      snack('الماس کافی نیست.');
      return;
    }
    const requestId = `continue-gems-${newRequestId()}`;
    const spend = Economy.spendGems(
      saveRef.current,
      GameBalanceConfig.CONTINUE_GEM_COST,
      CoinReason.CONTINUE_GEMS,
      requestId,
      Date.now()
    );
    if (spend.type === 'InsufficientFunds') {
      snack('الماس کافی نیست.');
      return;
    }
    if (spend.type !== 'Applied') {
      snack('انجام این کار ممکن نیست.');
      return;
    }
    commitSave(() => spend.save);
    if (active.applyRescue(plan)) {
      resumeAfterContinue(active);
    } else {
      commitSave((s) => {
        const refund = Economy.grantGems(
          s,
          GameBalanceConfig.CONTINUE_GEM_COST,
          CoinReason.ADJUST,
          `refund-${requestId}`,
          Date.now()
        );
        return refund.type === 'Applied' ? refund.save : s;
      });
      snack('ادامه ممکن نبود؛ الماس بازگردانده شد.');
    }
  }, [commitSave, resumeAfterContinue, snack]);

  const applyRewardedReward = useCallback(
    (purpose: RewardPurpose, requestId: string) => {
      commitSave((s) => {
        let next = { ...s, lastRewardedAtMs: Date.now() };
        if (purpose === RewardPurpose.COINS) {
          const granted = Economy.grant(
            next,
            GameBalanceConfig.REWARDED_AD_COINS,
            CoinReason.REWARDED_AD,
            requestId,
            Date.now()
          );
          if (granted.type === 'Applied') {
            next = granted.save;
            soundPlayer.playCoin(next.soundEnabled);
          }
        }
        return next;
      });

      if (purpose === RewardPurpose.COINS) {
        snack(`${faDigits(GameBalanceConfig.REWARDED_AD_COINS)} سکه اضافه شد.`);
      } else if (purpose === RewardPurpose.CONTINUE) {
        const active = sessionRef.current;
        const plan = uiRef.current.pendingRescue;
        if (active && plan && active.applyRescue(plan)) {
          resumeAfterContinue(active);
        } else {
          snack('ادامه ممکن نبود.');
        }
      }
    },
    [commitSave, resumeAfterContinue, snack]
  );

  const closeAdOverlay = useCallback(() => {
    setUi((prev) => ({
      ...prev,
      ad: { showing: false, simulated: false, purpose: null, message: null },
    }));
  }, []);

  const requestRewarded = useCallback(
    (purpose: RewardPurpose) => {
      if (uiRef.current.ad.showing) return;
      const requestId = `ad-${newRequestId()}`;
      const native = isNativeAdsAvailable();

      setUi((prev) => ({
        ...prev,
        ad: { showing: true, simulated: !native, purpose, message: null },
      }));

      if (native) {
        // Real Tapsell rewarded video: the reward is granted only when the SDK reports a
        // completed view, never on an early close or a failed load.
        void showRewardedAd()
          .then((result) => {
            if (result.status === 'rewarded') {
              applyRewardedReward(purpose, requestId);
            } else if (result.status === 'closed') {
              snack('برای دریافت جایزه باید ویدیو را کامل تماشا کنی.');
            } else {
              snack('تبلیغ در دسترس نبود؛ چند لحظه بعد دوباره تلاش کن.');
            }
          })
          .finally(closeAdOverlay);
        return;
      }

      const rewardTimer = window.setTimeout(() => {
        applyRewardedReward(purpose, requestId);
      }, 1400);

      const closeTimer = window.setTimeout(closeAdOverlay, 1700);

      adTimersRef.current.push(rewardTimer, closeTimer);
    },
    [applyRewardedReward, closeAdOverlay, snack]
  );

  const requestRewardedCoins = useCallback(() => {
    requestRewarded(RewardPurpose.COINS);
  }, [requestRewarded]);

  const continueWithAd = useCallback(() => {
    if (!uiRef.current.pendingRescue) return;
    requestRewarded(RewardPurpose.CONTINUE);
  }, [requestRewarded]);

  const declineContinue = useCallback(() => {
    const cur = uiRef.current;
    if (!cur.pendingRescue && finalizedRef.current) {
      goHome();
      return;
    }
    const result = finalizeRun(false);
    setUi((prev) => ({ ...prev, result, pendingRescue: null, inputLocked: true }));
  }, [finalizeRun, goHome]);

  const playAgain = useCallback(() => {
    const cur = uiRef.current;
    if (!finalizedRef.current && cur.pendingRescue) {
      finalizeRun(false);
    }
    if (cur.mode === GameMode.LEVEL && cur.level) {
      startLevel(cur.level.id);
    } else if (cur.mode === GameMode.DAILY) {
      startDaily();
    } else {
      startNewClassic();
    }
  }, [finalizeRun, startDaily, startLevel, startNewClassic]);

  const nextLevel = useCallback(() => {
    const cur = uiRef.current;
    if (!cur.level) return;
    startLevel(cur.level.id + 1);
  }, [startLevel]);

  const homeFromResult = useCallback(() => {
    const cur = uiRef.current;
    if (!finalizedRef.current && cur.pendingRescue) {
      finalizeRun(false);
    }
    goHome();
  }, [finalizeRun, goHome]);

  const chooseTheme = useCallback(
    (themeId: string) => {
      const save = saveRef.current;
      if (save.ownedThemes.includes(themeId)) {
        if (save.selectedTheme === themeId) return;
        commitSave((s) => ({ ...s, selectedTheme: themeId }));
        snack('پوستهٔ بازی تغییر کرد.');
        return;
      }
      const pricing = GameBalanceConfig.themePricing(themeId);
      if (pricing.currency === 'GEMS' && save.gems < pricing.price) {
        snack(`برای این پوسته ${faDigits(pricing.price)} الماس لازم است.`);
        return;
      }
      if (pricing.currency === 'COINS' && save.coins < pricing.price) {
        snack(`برای این پوسته ${faDigits(pricing.price)} سکه لازم است.`);
        return;
      }
      const res = Economy.purchaseTheme(save, themeId, `theme-${themeId}`, Date.now());
      if (res.type === 'Applied') {
        commitSave(() => res.save);
        soundPlayer.playCoin(saveRef.current.soundEnabled);
        snack('پوستهٔ جدید با موفقیت باز و فعال شد!');
      } else if (res.type === 'Duplicate') {
        commitSave((s) => ({ ...s, selectedTheme: themeId }));
      } else if (res.type === 'InsufficientFunds') {
        snack(pricing.currency === 'GEMS' ? 'الماس کافی نیست.' : 'سکه کافی نیست.');
      } else {
        snack('خرید ممکن نیست.');
      }
    },
    [commitSave, snack]
  );

  const exchangeGemsForCoins = useCallback(() => {
    const save = saveRef.current;
    if (save.gems < GameBalanceConfig.GEM_TO_COINS_COST) {
      snack(`برای تبدیل به ${faDigits(GameBalanceConfig.GEM_TO_COINS_COST)} الماس نیاز داری.`);
      return;
    }
    const res = Economy.exchangeGemsForCoins(save, `exchange-${newRequestId()}`, Date.now());
    if (res.type === 'Applied') {
      commitSave(() => res.save);
      soundPlayer.playCoin(saveRef.current.soundEnabled);
      snack(
        `${faDigits(GameBalanceConfig.GEM_TO_COINS_COST)} الماس به ${faDigits(
          GameBalanceConfig.GEM_TO_COINS_AMOUNT
        )} سکه تبدیل شد.`
      );
    } else {
      snack('تبدیل الماس انجام نشد.');
    }
  }, [commitSave, snack]);

  const grantBazaarProduct = useCallback(
    (product: BazaarProduct, orderId: string) => {
      const res = Economy.applyBazaarPurchase(
        saveRef.current,
        product,
        `bazaar-${product.sku}-${orderId}`,
        Date.now()
      );
      if (res.type === 'Applied') {
        commitSave(() => res.save);
        soundPlayer.playCoin(saveRef.current.soundEnabled);
        const parts: string[] = [];
        if (product.coins > 0) parts.push(`${faDigits(product.coins)} سکه`);
        if (product.gems > 0) parts.push(`${faDigits(product.gems)} الماس`);
        snack(`خرید از کافه‌بازار انجام شد: ${parts.join(' و ')} به حساب اضافه شد.`);
      } else {
        snack('ثبت بسته انجام نشد.');
      }
    },
    [commitSave, snack]
  );

  const startBazaarPurchase = useCallback(
    async (sku: string) => {
      const product = GameBalanceConfig.bazaarProductBySku(sku);
      if (!product) {
        snack('بستهٔ انتخابی پیدا نشد.');
        return;
      }

      if (isNativeBazaarAvailable()) {
        setUi((prev) => ({ ...prev, bazaarProcessing: true }));
        try {
          const res = await launchNativeBazaarPurchase(product.sku, newRequestId());
          setUi((prev) => ({ ...prev, bazaarProcessing: false }));
          if (res.success) {
            grantBazaarProduct(product, res.orderId ?? newRequestId());
          } else if (res.cancelled) {
            snack('پرداخت در کافه‌بازار لغو شد.');
          } else {
            snack(res.errorMessage || 'خطا در برقراری ارتباط با کافه‌بازار.');
          }
        } catch {
          setUi((prev) => ({ ...prev, bazaarProcessing: false }));
          snack('خطا در اجرای پرداخت کافه‌بازار.');
        }
        return;
      }

      // Web preview: open interactive Cafe Bazaar sandbox checkout modal
      setUi((prev) => ({ ...prev, pendingBazaarProduct: product, bazaarProcessing: false }));
    },
    [grantBazaarProduct, snack]
  );

  const confirmSandboxBazaarPurchase = useCallback(() => {
    const product = uiRef.current.pendingBazaarProduct;
    if (!product || uiRef.current.bazaarProcessing) return;
    setUi((prev) => ({ ...prev, bazaarProcessing: true }));
    window.setTimeout(() => {
      grantBazaarProduct(product, `sandbox-${newRequestId()}`);
      setUi((prev) => ({ ...prev, pendingBazaarProduct: null, bazaarProcessing: false }));
    }, 550);
  }, [grantBazaarProduct]);

  const cancelSandboxBazaarPurchase = useCallback(() => {
    setUi((prev) => ({ ...prev, pendingBazaarProduct: null, bazaarProcessing: false }));
  }, []);

  const setSoundEnabled = useCallback(
    (enabled: boolean) => commitSave((s) => ({ ...s, soundEnabled: enabled })),
    [commitSave]
  );

  const setVibrationEnabled = useCallback(
    (enabled: boolean) => {
      commitSave((s) => ({ ...s, vibrationEnabled: enabled }));
      if (enabled) triggerHaptic(true);
    },
    [commitSave]
  );

  const setReduceMotion = useCallback(
    (enabled: boolean) => commitSave((s) => ({ ...s, reduceMotion: enabled })),
    [commitSave]
  );

  const setPersonalizedConsent = useCallback(
    (enabled: boolean) => commitSave((s) => ({ ...s, personalizedAdsConsent: enabled })),
    [commitSave]
  );

  const resetProgress = useCallback(() => {
    sessionRef.current = null;
    finalizedRef.current = false;
    commitSave((s) => ({
      ...s,
      unlockedLevel: 1,
      levelStars: {},
      firstWinClaimed: [],
      threeStarGemClaimed: [],
      seenStoryChapters: [],
      claimedStoryRewards: [],
      classicBest: 0,
      daily: { dayKey: '', bestScore: 0, rewardClaimed: false },
      activeRun: null,
      stats: { runsFinished: 0, classicRuns: 0, levelWins: 0, rewardedShows: 0 },
      onboardingDone: true,
    }));
    setUi((prev) => ({
      ...prev,
      screen: Screen.HOME,
      session: null,
      mode: null,
      level: null,
      result: null,
      pendingRescue: null,
      activeStoryModal: null,
      snack: 'پیشرفت بازی پاک شد.',
    }));
  }, [commitSave]);

  return {
    ui,
    goHome,
    openLevels,
    openShop,
    openSettings,
    openPrivacy,
    openStoryChapter,
    dismissStoryModal,
    startClassic,
    startNewClassic,
    startLevel,
    startDaily,
    resumeActive,
    canPlace,
    placePiece,
    updateDrag,
    dropDrag,
    selectSlot,
    requestUndo,
    requestSwap,
    toggleHammer,
    hammerAt,
    continueWithCoins,
    continueWithGems,
    continueWithAd,
    declineContinue,
    playAgain,
    nextLevel,
    homeFromResult,
    requestRewardedCoins,
    chooseTheme,
    exchangeGemsForCoins,
    startBazaarPurchase,
    confirmSandboxBazaarPurchase,
    cancelSandboxBazaarPurchase,
    setSoundEnabled,
    setVibrationEnabled,
    setReduceMotion,
    setPersonalizedConsent,
    resetProgress,
    dismissSnack,
  };
}

export type GameController = ReturnType<typeof useGameController>;
