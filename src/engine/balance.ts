import { Difficulty } from './models';
import { Shapes } from './shapes';

export type ThemeCurrency = 'COINS' | 'GEMS';

export interface ThemePricing {
  currency: ThemeCurrency;
  price: number;
}

export interface BazaarProduct {
  sku: string;
  title: string;
  subtitle: string;
  coins: number;
  gems: number;
  priceToman: number;
  badge?: string;
  accentTone: 'gold' | 'gem' | 'bundle';
}

export const BAZAAR_PRODUCTS: BazaarProduct[] = [
  {
    sku: 'ir.blockestan.coins_500',
    title: 'کیسهٔ ۵۰۰ سکه',
    subtitle: 'مناسب برای تقویت‌کننده‌ها و پوسته‌های کلاسیک',
    coins: 500,
    gems: 0,
    priceToman: 30000,
    accentTone: 'gold',
  },
  {
    sku: 'ir.blockestan.coins_1500',
    title: 'صندوق ۱,۵۰۰ سکه',
    subtitle: '۲۰٪ سکهٔ بیشتر برای بازکردن چند پوسته',
    coins: 1500,
    gems: 0,
    priceToman: 78000,
    badge: 'محبوب‌ترین',
    accentTone: 'gold',
  },
  {
    sku: 'ir.blockestan.gems_25',
    title: 'کیسهٔ ۲۵ الماس',
    subtitle: 'بازکردن پوسته‌های ویژهٔ الماسی و ادامهٔ سریع',
    coins: 0,
    gems: 25,
    priceToman: 58000,
    accentTone: 'gem',
  },
  {
    sku: 'ir.blockestan.starter_bundle',
    title: 'بستهٔ نورانی بلوکستان',
    subtitle: '۱,۲۰۰ سکه + ۳۰ الماس با تخفیف ویژهٔ کافه‌بازار',
    coins: 1200,
    gems: 30,
    priceToman: 98000,
    badge: 'به‌صرفه‌ترین',
    accentTone: 'bundle',
  },
];

const THEME_PRICING: Record<string, ThemePricing> = {
  turquoise: { currency: 'COINS', price: 0 },
  purple_night: { currency: 'COINS', price: 250 },
  sunny: { currency: 'COINS', price: 350 },
  minimal_light: { currency: 'COINS', price: 450 },
  deep_ocean: { currency: 'COINS', price: 550 },
  emerald_forest: { currency: 'COINS', price: 650 },
  rose_dusk: { currency: 'GEMS', price: 12 },
  royal_mosaic: { currency: 'GEMS', price: 20 },
};

export const GameBalanceConfig = {
  // Coin Economy
  STARTING_COINS: 150,
  FIRST_LEVEL_WIN_COINS: 30,
  REWARDED_AD_COINS: 40,
  UNDO_COST: 50,
  SWAP_COST: 70,
  HAMMER_COST: 90,
  CONTINUE_COST: 100,
  DAILY_REWARD_COINS: 20,
  DAILY_REWARD_SCORE: 250,

  // Diamond (Gem) Economy
  STARTING_GEMS: 5,
  LEVEL_THREE_STAR_BONUS_GEMS: 1,
  CHAPTER_COMPLETE_GEMS: 5,
  CHAPTER_COMPLETE_COINS: 100,
  CONTINUE_GEM_COST: 1,
  GEM_TO_COINS_COST: 2,
  GEM_TO_COINS_AMOUNT: 150,

  // Scoring
  POINTS_PER_PLACED_CELL: 5,
  POINTS_PER_LINE: 100,
  MULTI_LINE_BONUS_PER_EXTRA_LINE: 75,
  COMBO_MULTIPLIER_STEP: 0.25,
  MAX_COMBO: 8,
  MAX_COMBO_MULTIPLIER: 2.0,

  // Level campaign
  TOTAL_LEVELS: 60,
  MAX_LEVEL_REFERENCE_MOVES: 16,

  // Ads policy
  INTERSTITIAL_FIRST_RUNS_WITHOUT_ADS: 3,
  INTERSTITIAL_MIN_INTERVAL_SECONDS: 180,
  INTERSTITIAL_EVERY_N_RUNS: 3,
  INTERSTITIAL_AFTER_REWARDED_COOLDOWN_SECONDS: 120,

  // Daily challenge algorithm version
  DAILY_ALGORITHM_VERSION: 1,

  shapeWeights: {
    [Difficulty.EASY]: {
      [Shapes.SINGLE.name]: 18,
      [Shapes.DOMINO_H.name]: 16,
      [Shapes.DOMINO_V.name]: 16,
      [Shapes.LINE3_H.name]: 12,
      [Shapes.LINE3_V.name]: 12,
      [Shapes.SQUARE2.name]: 12,
      [Shapes.L3_A.name]: 8,
      [Shapes.L3_B.name]: 8,
      [Shapes.L3_C.name]: 8,
      [Shapes.L3_D.name]: 8,
      [Shapes.LINE4_H.name]: 5,
      [Shapes.LINE4_V.name]: 5,
      [Shapes.RECT2X3.name]: 4,
      [Shapes.RECT3X2.name]: 4,
      [Shapes.L4_A.name]: 2,
      [Shapes.L4_B.name]: 2,
      [Shapes.L4_C.name]: 2,
      [Shapes.L4_D.name]: 2,
      [Shapes.T4_UP.name]: 2,
      [Shapes.T4_DOWN.name]: 2,
      [Shapes.T4_LEFT.name]: 2,
      [Shapes.T4_RIGHT.name]: 2,
    },
    [Difficulty.NORMAL]: {
      [Shapes.SINGLE.name]: 7,
      [Shapes.DOMINO_H.name]: 11,
      [Shapes.DOMINO_V.name]: 11,
      [Shapes.LINE3_H.name]: 11,
      [Shapes.LINE3_V.name]: 11,
      [Shapes.SQUARE2.name]: 10,
      [Shapes.L3_A.name]: 7,
      [Shapes.L3_B.name]: 7,
      [Shapes.L3_C.name]: 7,
      [Shapes.L3_D.name]: 7,
      [Shapes.LINE4_H.name]: 9,
      [Shapes.LINE4_V.name]: 9,
      [Shapes.RECT2X3.name]: 7,
      [Shapes.RECT3X2.name]: 7,
      [Shapes.L4_A.name]: 6,
      [Shapes.L4_B.name]: 6,
      [Shapes.L4_C.name]: 6,
      [Shapes.L4_D.name]: 6,
      [Shapes.T4_UP.name]: 5,
      [Shapes.T4_DOWN.name]: 5,
      [Shapes.T4_LEFT.name]: 5,
      [Shapes.T4_RIGHT.name]: 5,
      [Shapes.S4.name]: 4,
      [Shapes.Z4.name]: 4,
    },
    [Difficulty.HARD]: {
      [Shapes.SINGLE.name]: 2,
      [Shapes.DOMINO_H.name]: 5,
      [Shapes.DOMINO_V.name]: 5,
      [Shapes.LINE3_H.name]: 8,
      [Shapes.LINE3_V.name]: 8,
      [Shapes.SQUARE2.name]: 8,
      [Shapes.L3_A.name]: 6,
      [Shapes.L3_B.name]: 6,
      [Shapes.L3_C.name]: 6,
      [Shapes.L3_D.name]: 6,
      [Shapes.LINE4_H.name]: 11,
      [Shapes.LINE4_V.name]: 11,
      [Shapes.RECT2X3.name]: 9,
      [Shapes.RECT3X2.name]: 9,
      [Shapes.L4_A.name]: 8,
      [Shapes.L4_B.name]: 8,
      [Shapes.L4_C.name]: 8,
      [Shapes.L4_D.name]: 8,
      [Shapes.T4_UP.name]: 8,
      [Shapes.T4_DOWN.name]: 8,
      [Shapes.T4_LEFT.name]: 8,
      [Shapes.T4_RIGHT.name]: 8,
      [Shapes.S4.name]: 5,
      [Shapes.Z4.name]: 5,
    },
  } as Record<Difficulty, Record<string, number>>,

  themePricing(themeId: string): ThemePricing {
    const pricing = THEME_PRICING[themeId];
    if (!pricing) {
      throw new Error(`Unknown theme '${themeId}'`);
    }
    return pricing;
  },

  themePrice(themeId: string): number {
    return this.themePricing(themeId).price;
  },

  isValidTheme(themeId: string): boolean {
    return Object.prototype.hasOwnProperty.call(THEME_PRICING, themeId);
  },

  bazaarProductBySku(sku: string): BazaarProduct | undefined {
    return BAZAAR_PRODUCTS.find((p) => p.sku === sku);
  },
};
