import { BazaarProduct, GameBalanceConfig } from './balance';
import {
  AppSaveData,
  CoinReason,
  CoinTransaction,
  MAX_APPLIED_IDS,
  MAX_AUDIT_ROWS,
  MAX_GRANTED_IDS,
  sanitizeSaveData,
} from './persistence';

export type EconomyResult =
  | { type: 'Applied'; save: AppSaveData; transaction: CoinTransaction }
  | { type: 'Duplicate'; requestId: string }
  | { type: 'InsufficientFunds' }
  | { type: 'Rejected'; reason: string };

export const Economy = {
  costOf(reason: CoinReason): number | null {
    switch (reason) {
      case CoinReason.UNDO:
        return GameBalanceConfig.UNDO_COST;
      case CoinReason.SWAP:
        return GameBalanceConfig.SWAP_COST;
      case CoinReason.HAMMER:
        return GameBalanceConfig.HAMMER_COST;
      case CoinReason.CONTINUE:
        return GameBalanceConfig.CONTINUE_COST;
      default:
        return null;
    }
  },

  grant(
    save: AppSaveData,
    amount: number,
    reason: CoinReason,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (amount <= 0) throw new Error('Grant amount must be positive');
    if (!requestId.trim()) return { type: 'Rejected', reason: 'Request id must not be blank' };
    if (save.appliedRequestIds.includes(requestId)) {
      return { type: 'Duplicate', requestId };
    }

    const transaction: CoinTransaction = {
      id: `tx-${requestId}`,
      reason,
      amount,
      currency: 'COINS',
      atEpochMs: nowMs,
      requestId,
    };

    const updated = sanitizeSaveData({
      ...save,
      coins: save.coins + amount,
      transactions: [...save.transactions, transaction].slice(-MAX_AUDIT_ROWS),
      grantedAdRewardIds:
        reason === CoinReason.REWARDED_AD
          ? [...save.grantedAdRewardIds, requestId].slice(-MAX_GRANTED_IDS)
          : save.grantedAdRewardIds,
      appliedRequestIds: [...save.appliedRequestIds, requestId].slice(-MAX_APPLIED_IDS),
    });

    return { type: 'Applied', save: updated, transaction };
  },

  spend(
    save: AppSaveData,
    amount: number,
    reason: CoinReason,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (amount <= 0) throw new Error('Spend amount must be positive');
    if (!requestId.trim()) return { type: 'Rejected', reason: 'Request id must not be blank' };
    if (save.appliedRequestIds.includes(requestId)) {
      return { type: 'Duplicate', requestId };
    }
    if (save.coins < amount) {
      return { type: 'InsufficientFunds' };
    }

    const transaction: CoinTransaction = {
      id: `tx-${requestId}`,
      reason,
      amount: -amount,
      currency: 'COINS',
      atEpochMs: nowMs,
      requestId,
    };

    const updated = sanitizeSaveData({
      ...save,
      coins: save.coins - amount,
      transactions: [...save.transactions, transaction].slice(-MAX_AUDIT_ROWS),
      appliedRequestIds: [...save.appliedRequestIds, requestId].slice(-MAX_APPLIED_IDS),
    });

    return { type: 'Applied', save: updated, transaction };
  },

  grantGems(
    save: AppSaveData,
    amount: number,
    reason: CoinReason,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (amount <= 0) throw new Error('Gem grant amount must be positive');
    if (!requestId.trim()) return { type: 'Rejected', reason: 'Request id must not be blank' };
    if (save.appliedRequestIds.includes(requestId)) {
      return { type: 'Duplicate', requestId };
    }

    const transaction: CoinTransaction = {
      id: `tx-${requestId}`,
      reason,
      amount,
      currency: 'GEMS',
      atEpochMs: nowMs,
      requestId,
    };

    const updated = sanitizeSaveData({
      ...save,
      gems: save.gems + amount,
      transactions: [...save.transactions, transaction].slice(-MAX_AUDIT_ROWS),
      appliedRequestIds: [...save.appliedRequestIds, requestId].slice(-MAX_APPLIED_IDS),
    });

    return { type: 'Applied', save: updated, transaction };
  },

  spendGems(
    save: AppSaveData,
    amount: number,
    reason: CoinReason,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (amount <= 0) throw new Error('Gem spend amount must be positive');
    if (!requestId.trim()) return { type: 'Rejected', reason: 'Request id must not be blank' };
    if (save.appliedRequestIds.includes(requestId)) {
      return { type: 'Duplicate', requestId };
    }
    if (save.gems < amount) {
      return { type: 'InsufficientFunds' };
    }

    const transaction: CoinTransaction = {
      id: `tx-${requestId}`,
      reason,
      amount: -amount,
      currency: 'GEMS',
      atEpochMs: nowMs,
      requestId,
    };

    const updated = sanitizeSaveData({
      ...save,
      gems: save.gems - amount,
      transactions: [...save.transactions, transaction].slice(-MAX_AUDIT_ROWS),
      appliedRequestIds: [...save.appliedRequestIds, requestId].slice(-MAX_APPLIED_IDS),
    });

    return { type: 'Applied', save: updated, transaction };
  },

  buyBooster(save: AppSaveData, reason: CoinReason, requestId: string, nowMs: number): EconomyResult {
    const cost = this.costOf(reason);
    if (cost === null) return { type: 'Rejected', reason: 'Not a booster spend' };
    return this.spend(save, cost, reason, requestId, nowMs);
  },

  claimFirstLevelWin(
    save: AppSaveData,
    levelId: number,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (save.firstWinClaimed.includes(levelId)) {
      return { type: 'Rejected', reason: `First win for level ${levelId} already claimed` };
    }
    const base: AppSaveData = {
      ...save,
      firstWinClaimed: [...save.firstWinClaimed, levelId],
    };
    return this.grant(base, GameBalanceConfig.FIRST_LEVEL_WIN_COINS, CoinReason.LEVEL_FIRST_WIN, requestId, nowMs);
  },

  claimThreeStarGem(
    save: AppSaveData,
    levelId: number,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (save.threeStarGemClaimed.includes(levelId)) {
      return { type: 'Rejected', reason: `3-star gem for level ${levelId} already claimed` };
    }
    const base: AppSaveData = {
      ...save,
      threeStarGemClaimed: [...save.threeStarGemClaimed, levelId],
    };
    return this.grantGems(
      base,
      GameBalanceConfig.LEVEL_THREE_STAR_BONUS_GEMS,
      CoinReason.THREE_STAR_BONUS,
      requestId,
      nowMs
    );
  },

  claimStoryChapterReward(
    save: AppSaveData,
    chapterId: number,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (save.claimedStoryRewards.includes(chapterId)) {
      return { type: 'Rejected', reason: `Chapter ${chapterId} reward already claimed` };
    }
    const withChapter: AppSaveData = {
      ...save,
      claimedStoryRewards: [...save.claimedStoryRewards, chapterId],
    };
    const coinRes = this.grant(
      withChapter,
      GameBalanceConfig.CHAPTER_COMPLETE_COINS,
      CoinReason.STORY_CHAPTER_REWARD,
      `${requestId}-coins`,
      nowMs
    );
    if (coinRes.type !== 'Applied') return coinRes;
    return this.grantGems(
      coinRes.save,
      GameBalanceConfig.CHAPTER_COMPLETE_GEMS,
      CoinReason.STORY_CHAPTER_REWARD,
      `${requestId}-gems`,
      nowMs
    );
  },

  exchangeGemsForCoins(save: AppSaveData, requestId: string, nowMs: number): EconomyResult {
    const spent = this.spendGems(
      save,
      GameBalanceConfig.GEM_TO_COINS_COST,
      CoinReason.GEM_EXCHANGE,
      `${requestId}-gem`,
      nowMs
    );
    if (spent.type !== 'Applied') return spent;
    return this.grant(
      spent.save,
      GameBalanceConfig.GEM_TO_COINS_AMOUNT,
      CoinReason.GEM_EXCHANGE,
      `${requestId}-coin`,
      nowMs
    );
  },

  applyBazaarPurchase(
    save: AppSaveData,
    product: BazaarProduct,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    let current = save;
    let lastTx: CoinTransaction | null = null;

    if (product.coins > 0) {
      const cRes = this.grant(
        current,
        product.coins,
        CoinReason.BAZAAR_PURCHASE,
        `${requestId}-coins`,
        nowMs
      );
      if (cRes.type !== 'Applied') return cRes;
      current = cRes.save;
      lastTx = cRes.transaction;
    }

    if (product.gems > 0) {
      const gRes = this.grantGems(
        current,
        product.gems,
        CoinReason.BAZAAR_PURCHASE,
        `${requestId}-gems`,
        nowMs
      );
      if (gRes.type !== 'Applied') return gRes;
      current = gRes.save;
      lastTx = gRes.transaction;
    }

    if (!lastTx) {
      return { type: 'Rejected', reason: 'Empty product' };
    }
    return { type: 'Applied', save: current, transaction: lastTx };
  },

  claimDailyReward(
    save: AppSaveData,
    dayKey: string,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (!dayKey.trim()) return { type: 'Rejected', reason: 'Day key must not be blank' };
    if (save.daily.dayKey === dayKey && save.daily.rewardClaimed) {
      return { type: 'Rejected', reason: `Daily reward already claimed for ${dayKey}` };
    }
    const previous = save.daily.dayKey === dayKey ? save.daily : { dayKey, bestScore: 0, rewardClaimed: false };
    const base: AppSaveData = {
      ...save,
      daily: { ...previous, dayKey, rewardClaimed: true },
    };
    return this.grant(base, GameBalanceConfig.DAILY_REWARD_COINS, CoinReason.DAILY_REWARD, requestId, nowMs);
  },

  recordDailyResult(save: AppSaveData, dayKey: string, score: number): AppSaveData {
    if (!dayKey.trim()) return save;
    const previous = save.daily.dayKey === dayKey ? save.daily : { dayKey, bestScore: 0, rewardClaimed: false };
    return sanitizeSaveData({
      ...save,
      daily: {
        ...previous,
        dayKey,
        bestScore: Math.max(previous.bestScore, score),
      },
    });
  },

  purchaseTheme(
    save: AppSaveData,
    themeId: string,
    requestId: string,
    nowMs: number
  ): EconomyResult {
    if (!GameBalanceConfig.isValidTheme(themeId)) {
      return { type: 'Rejected', reason: `Unknown theme '${themeId}'` };
    }
    if (save.ownedThemes.includes(themeId)) {
      return { type: 'Rejected', reason: `Theme '${themeId}' is already owned` };
    }
    const pricing = GameBalanceConfig.themePricing(themeId);
    if (pricing.price === 0) {
      const updated = sanitizeSaveData({
        ...save,
        ownedThemes: [...save.ownedThemes, themeId],
        selectedTheme: themeId,
      });
      return {
        type: 'Applied',
        save: updated,
        transaction: {
          id: `tx-${requestId}`,
          reason: CoinReason.THEME_PURCHASE,
          amount: 0,
          currency: 'COINS',
          atEpochMs: nowMs,
          requestId,
        },
      };
    }

    const spent =
      pricing.currency === 'GEMS'
        ? this.spendGems(save, pricing.price, CoinReason.THEME_PURCHASE_GEMS, requestId, nowMs)
        : this.spend(save, pricing.price, CoinReason.THEME_PURCHASE, requestId, nowMs);

    if (spent.type !== 'Applied') return spent;
    const updated = sanitizeSaveData({
      ...spent.save,
      ownedThemes: [...spent.save.ownedThemes, themeId],
      selectedTheme: themeId,
    });
    return { type: 'Applied', save: updated, transaction: spent.transaction };
  },
};
