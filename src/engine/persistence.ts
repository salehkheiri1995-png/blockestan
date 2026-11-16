import { GameBalanceConfig } from './balance';
import { GameMode, GameState } from './models';

export const SAVE_FORMAT_CURRENT = 1;
export const MAX_AUDIT_ROWS = 40;
export const MAX_GRANTED_IDS = 80;
export const MAX_APPLIED_IDS = 160;

export type CurrencyKind = 'COINS' | 'GEMS';

export enum CoinReason {
  START = 'START',
  LEVEL_FIRST_WIN = 'LEVEL_FIRST_WIN',
  THREE_STAR_BONUS = 'THREE_STAR_BONUS',
  STORY_CHAPTER_REWARD = 'STORY_CHAPTER_REWARD',
  DAILY_REWARD = 'DAILY_REWARD',
  REWARDED_AD = 'REWARDED_AD',
  THEME_PURCHASE = 'THEME_PURCHASE',
  THEME_PURCHASE_GEMS = 'THEME_PURCHASE_GEMS',
  UNDO = 'UNDO',
  SWAP = 'SWAP',
  HAMMER = 'HAMMER',
  CONTINUE = 'CONTINUE',
  CONTINUE_GEMS = 'CONTINUE_GEMS',
  GEM_EXCHANGE = 'GEM_EXCHANGE',
  BAZAAR_PURCHASE = 'BAZAAR_PURCHASE',
  ADJUST = 'ADJUST',
}

export interface CoinTransaction {
  id: string;
  reason: CoinReason;
  amount: number;
  currency?: CurrencyKind;
  atEpochMs: number;
  requestId?: string | null;
}

export interface StatsSave {
  runsFinished: number;
  classicRuns: number;
  levelWins: number;
  rewardedShows: number;
}

export interface DailySave {
  dayKey: string;
  bestScore: number;
  rewardClaimed: boolean;
}

export interface ActiveRunSave {
  mode: GameMode;
  levelId: number | null;
  dayKey: string | null;
  state: GameState;
}

export interface AppSaveData {
  formatVersion: number;
  coins: number;
  gems: number;
  ownedThemes: string[];
  selectedTheme: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reduceMotion: boolean;
  personalizedAdsConsent: boolean;
  onboardingDone: boolean;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  firstWinClaimed: number[];
  threeStarGemClaimed: number[];
  seenStoryChapters: number[];
  claimedStoryRewards: number[];
  classicBest: number;
  daily: DailySave;
  activeRun: ActiveRunSave | null;
  stats: StatsSave;
  transactions: CoinTransaction[];
  grantedAdRewardIds: string[];
  lastInterstitialAtMs: number;
  lastRewardedAtMs: number;
  appliedRequestIds: string[];
}

export interface SaveEnvelope {
  formatVersion: number;
  savedAtEpochMs: number;
  data: AppSaveData;
}

export function createDefaultSave(): AppSaveData {
  return {
    formatVersion: SAVE_FORMAT_CURRENT,
    coins: GameBalanceConfig.STARTING_COINS,
    gems: GameBalanceConfig.STARTING_GEMS,
    ownedThemes: ['turquoise'],
    selectedTheme: 'turquoise',
    soundEnabled: true,
    vibrationEnabled: true,
    reduceMotion: false,
    personalizedAdsConsent: false,
    onboardingDone: false,
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
    transactions: [],
    grantedAdRewardIds: [],
    lastInterstitialAtMs: 0,
    lastRewardedAtMs: 0,
    appliedRequestIds: [],
  };
}

export function sanitizeSaveData(raw: Partial<AppSaveData>): AppSaveData {
  const def = createDefaultSave();
  const ownedSet = new Set<string>(
    (Array.isArray(raw.ownedThemes) ? raw.ownedThemes : def.ownedThemes).filter((t) =>
      GameBalanceConfig.isValidTheme(t)
    )
  );
  ownedSet.add('turquoise');

  const validTheme =
    raw.selectedTheme && GameBalanceConfig.isValidTheme(raw.selectedTheme)
      ? raw.selectedTheme
      : 'turquoise';

  const unlockedLevel = Math.min(
    GameBalanceConfig.TOTAL_LEVELS,
    Math.max(1, typeof raw.unlockedLevel === 'number' ? Math.floor(raw.unlockedLevel) : 1)
  );

  const sanitizedStars: Record<number, number> = {};
  if (raw.levelStars && typeof raw.levelStars === 'object') {
    for (const [k, v] of Object.entries(raw.levelStars)) {
      const id = Number(k);
      if (Number.isInteger(id) && id >= 1 && id <= GameBalanceConfig.TOTAL_LEVELS && typeof v === 'number') {
        sanitizedStars[id] = Math.min(3, Math.max(0, Math.floor(v)));
      }
    }
  }

  const filterLevelIds = (list: unknown): number[] =>
    Array.from(
      new Set(
        (Array.isArray(list) ? list : []).filter(
          (id): id is number =>
            Number.isInteger(id) && id >= 1 && id <= GameBalanceConfig.TOTAL_LEVELS
        )
      )
    );

  const filterChapterIds = (list: unknown): number[] =>
    Array.from(
      new Set(
        (Array.isArray(list) ? list : []).filter(
          (id): id is number => Number.isInteger(id) && id >= 1 && id <= 3
        )
      )
    );

  const appliedDistinct = Array.from(
    new Set(Array.isArray(raw.appliedRequestIds) ? raw.appliedRequestIds : [])
  ).slice(-MAX_APPLIED_IDS);

  return {
    formatVersion: SAVE_FORMAT_CURRENT,
    coins: Math.max(0, typeof raw.coins === 'number' ? Math.floor(raw.coins) : def.coins),
    gems: Math.max(0, typeof raw.gems === 'number' ? Math.floor(raw.gems) : def.gems),
    ownedThemes: Array.from(ownedSet),
    selectedTheme: validTheme,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : def.soundEnabled,
    vibrationEnabled: typeof raw.vibrationEnabled === 'boolean' ? raw.vibrationEnabled : def.vibrationEnabled,
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : def.reduceMotion,
    personalizedAdsConsent:
      typeof raw.personalizedAdsConsent === 'boolean' ? raw.personalizedAdsConsent : def.personalizedAdsConsent,
    onboardingDone: typeof raw.onboardingDone === 'boolean' ? raw.onboardingDone : def.onboardingDone,
    unlockedLevel,
    levelStars: sanitizedStars,
    firstWinClaimed: filterLevelIds(raw.firstWinClaimed),
    threeStarGemClaimed: filterLevelIds(raw.threeStarGemClaimed),
    seenStoryChapters: filterChapterIds(raw.seenStoryChapters),
    claimedStoryRewards: filterChapterIds(raw.claimedStoryRewards),
    classicBest: Math.max(0, typeof raw.classicBest === 'number' ? Math.floor(raw.classicBest) : 0),
    daily: {
      dayKey: typeof raw.daily?.dayKey === 'string' ? raw.daily.dayKey : '',
      bestScore: Math.max(0, typeof raw.daily?.bestScore === 'number' ? Math.floor(raw.daily.bestScore) : 0),
      rewardClaimed: typeof raw.daily?.rewardClaimed === 'boolean' ? raw.daily.rewardClaimed : false,
    },
    activeRun: raw.activeRun ?? null,
    stats: {
      runsFinished: Math.max(0, typeof raw.stats?.runsFinished === 'number' ? raw.stats.runsFinished : 0),
      classicRuns: Math.max(0, typeof raw.stats?.classicRuns === 'number' ? raw.stats.classicRuns : 0),
      levelWins: Math.max(0, typeof raw.stats?.levelWins === 'number' ? raw.stats.levelWins : 0),
      rewardedShows: Math.max(0, typeof raw.stats?.rewardedShows === 'number' ? raw.stats.rewardedShows : 0),
    },
    transactions: (Array.isArray(raw.transactions) ? raw.transactions : []).slice(-MAX_AUDIT_ROWS),
    grantedAdRewardIds: (Array.isArray(raw.grantedAdRewardIds) ? raw.grantedAdRewardIds : []).slice(
      -MAX_GRANTED_IDS
    ),
    lastInterstitialAtMs:
      typeof raw.lastInterstitialAtMs === 'number' ? Math.max(0, raw.lastInterstitialAtMs) : 0,
    lastRewardedAtMs: typeof raw.lastRewardedAtMs === 'number' ? Math.max(0, raw.lastRewardedAtMs) : 0,
    appliedRequestIds: appliedDistinct,
  };
}

export function encodeSave(data: AppSaveData, savedAtEpochMs: number): string {
  const envelope: SaveEnvelope = {
    formatVersion: SAVE_FORMAT_CURRENT,
    savedAtEpochMs,
    data: sanitizeSaveData(data),
  };
  return JSON.stringify(envelope);
}

export function decodeSave(raw: string): AppSaveData {
  const parsed = JSON.parse(raw) as Partial<SaveEnvelope>;
  if (!parsed || typeof parsed !== 'object' || typeof parsed.formatVersion !== 'number') {
    throw new Error('Save envelope is not valid JSON');
  }
  if (parsed.formatVersion > SAVE_FORMAT_CURRENT) {
    throw new Error(`Save format ${parsed.formatVersion} is newer than ${SAVE_FORMAT_CURRENT}`);
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Save payload is not valid');
  }
  if (parsed.data.formatVersion !== SAVE_FORMAT_CURRENT) {
    throw new Error(`Payload version ${parsed.data.formatVersion} does not match ${SAVE_FORMAT_CURRENT}`);
  }
  return sanitizeSaveData(parsed.data);
}
