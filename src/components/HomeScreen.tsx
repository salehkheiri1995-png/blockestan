import React from 'react';
import bannerImg from '../assets/images/blockestan_home_banner_1794865543793.jpg';
import mascotImg from '../assets/images/blockestan_hero_mascot_1794865543635.jpg';
import trophyImg from '../assets/images/blockestan_trophy_reward_1794865544012.jpg';
import { activeStoryChapter, chapterSolvedCount } from '../data/story';
import { GameBalanceConfig } from '../engine/balance';
import { GameMode, RunStatus } from '../engine/models';
import { GameController, GameUiState } from '../state/useGameController';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits, groupedFa, todayDayKey } from '../utils/fa';
import { ArtImage, CurrencyPairBadge, PrimaryButton, SimulatedBadge } from './Components';

interface HomeScreenProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ ui, ctrl, palette }) => {
  const { save } = ui;
  const active = save.activeRun?.state.status === RunStatus.PLAYING ? save.activeRun : null;
  const totalStars = Object.values(save.levelStars).reduce((sum, s) => sum + s, 0);
  const maxStars = GameBalanceConfig.TOTAL_LEVELS * 3;
  const today = todayDayKey();

  const currentChapter = activeStoryChapter(save.unlockedLevel);
  const chapterTotalLevels = currentChapter.levelTo - currentChapter.levelFrom + 1;
  const chapterSolved = chapterSolvedCount(currentChapter, save.levelStars);

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-4 py-3 flex flex-col gap-3.5">
      {/* Compact Mobile-Friendly Header */}
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shrink-0 shadow-md"
            style={{ border: `2px solid ${hexAlpha(palette.accent, 0.55)}` }}
          >
            <ArtImage
              src={mascotImg}
              alt="فیروز نگهبان بلوکستان"
              className="w-full h-full object-cover"
              fallbackIcon="🧩"
              palette={palette}
            />
          </div>
          <div className="min-w-0">
            <h1
              className="font-bold text-[22px] sm:text-[28px] leading-tight truncate"
              style={{ color: palette.onSurface }}
            >
              بلوکستان
            </h1>
            <p className="text-[11px] truncate" style={{ color: palette.onSurfaceMuted }}>
              پازل آرامش‌بخش ۸×۸ · داستان و معما
            </p>
          </div>
        </div>
        <CurrencyPairBadge
          coins={save.coins}
          gems={save.gems}
          palette={palette}
          compact
          onClick={ctrl.openShop}
        />
      </div>

      {/* Storyline Adventure Card (Desktop 2-col with Hero Banner, Mobile stacked cleanly) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Story Chapter Card */}
        <div
          className="relative w-full rounded-[24px] overflow-hidden shadow-lg flex flex-col justify-between"
          style={{
            border: `1px solid ${hexAlpha(palette.gold, 0.42)}`,
            minHeight: '196px',
          }}
        >
          <ArtImage
            src={currentChapter.image}
            alt={currentChapter.title}
            className="absolute inset-0 w-full h-full object-cover"
            fallbackIcon="📖"
            palette={palette}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(6, 18, 22, 0.35) 0%, rgba(6, 18, 22, 0.88) 58%, rgba(6, 18, 22, 0.96) 100%)',
            }}
          />
          <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold" style={{ color: palette.gold }}>
                  خط داستانی بلوکستان · {currentChapter.landmark}
                </span>
                <h2 className="font-bold text-lg sm:text-xl text-white leading-snug mt-0.5">
                  {currentChapter.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => ctrl.openStoryChapter(currentChapter.id)}
                className="min-h-[38px] px-3 rounded-xl text-[11px] font-bold cursor-pointer shrink-0 transition-transform active:scale-95"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              >
                📖 خواندن داستان
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed line-clamp-2">
              «{currentChapter.dialogue[0].text}»
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-slate-200 tabular-nums">
                  <span>پیشرفت فصل</span>
                  <span>
                    {faDigits(chapterSolved)} از {faDigits(chapterTotalLevels)} مرحله
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-white/20">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (chapterSolved / chapterTotalLevels) * 100)}%`,
                      backgroundColor: palette.gold,
                    }}
                  />
                </div>
              </div>
              <PrimaryButton
                text={`مرحلهٔ ${faDigits(save.unlockedLevel)}`}
                onClick={() => ctrl.startLevel(save.unlockedLevel)}
                palette={palette}
                className="shrink-0 min-w-[116px]"
              />
            </div>
          </div>
        </div>

        {/* Hero Featured Endless / Resume Card */}
        <div
          className="relative w-full rounded-[24px] overflow-hidden shadow-lg flex flex-col justify-between"
          style={{
            border: `1px solid ${hexAlpha(palette.accent, 0.35)}`,
            minHeight: '196px',
          }}
        >
          <ArtImage
            src={bannerImg}
            alt="دنیای کاشی‌های رنگی بلوکستان"
            className="absolute inset-0 w-full h-full object-cover"
            fallbackIcon="🏰"
            palette={palette}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(4, 24, 22, 0.42) 0%, rgba(4, 24, 22, 0.88) 58%, rgba(4, 24, 22, 0.96) 100%)',
            }}
          />
          <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold" style={{ color: '#64DFCC' }}>
                  {active ? 'یک بازی ناتمام داری!' : 'چیدمان آزاد و آرامش‌بخش'}
                </span>
                <h2 className="font-bold text-lg sm:text-xl text-white leading-snug">
                  {active
                    ? active.mode === GameMode.LEVEL
                      ? `ادامهٔ مرحلهٔ ${faDigits(active.levelId ?? 0)}`
                      : active.mode === GameMode.DAILY
                        ? 'ادامهٔ چالش روزانه'
                        : 'ادامهٔ حالت بی‌پایان'
                    : 'حالت بی‌پایان'}
                </h2>
              </div>
              <div
                className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg ${
                  save.reduceMotion ? '' : 'animate-gentle-bob'
                }`}
                style={{ border: '2px solid rgba(255,255,255,0.28)' }}
              >
                <ArtImage
                  src={mascotImg}
                  alt="قهرمان بلوکستان"
                  className="w-full h-full object-cover"
                  fallbackIcon="🧩"
                  palette={palette}
                />
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {active
                ? `امتیاز فعلی: ${groupedFa(active.state.score)} · برگرد به صفحهٔ بازی`
                : `بدون محدودیت حرکت بازی کن، کمبو بساز و رکورد بزن · رکورد: ${groupedFa(save.classicBest)}`}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              {active ? (
                <button
                  type="button"
                  onClick={ctrl.startNewClassic}
                  className="text-xs font-medium text-teal-200 hover:text-white underline cursor-pointer py-2"
                >
                  یا شروع دست جدید
                </button>
              ) : (
                <span className="text-[11px] text-teal-100/80">امتیاز و سکه جمع کن</span>
              )}
              <PrimaryButton
                text={active ? 'ادامهٔ بازی' : 'شروع بی‌پایان'}
                onClick={active ? ctrl.resumeActive : ctrl.startClassic}
                palette={palette}
                className="min-w-[140px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Grid: 60 Levels Map + Daily Challenge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={ctrl.openLevels}
          className="w-full min-h-[112px] flex flex-col justify-between gap-2.5 rounded-[20px] p-4 text-start transition-transform active:scale-[0.99] cursor-pointer"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.accent, 0.35)}`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[17px]" style={{ color: palette.onSurface }}>
                نقشهٔ ۶۰ مرحله و ۳ فصل
              </h3>
              <p className="text-xs mt-0.5" style={{ color: palette.onSurfaceMuted }}>
                ۳ ستاره بگیر و الماس جایزه دریافت کن
              </p>
            </div>
            <span className="text-2xl leading-none" aria-hidden="true">
              🗺️
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: palette.accent }}>
                مرحلهٔ {faDigits(save.unlockedLevel)} از {faDigits(GameBalanceConfig.TOTAL_LEVELS)} باز
              </span>
              <span className="font-bold tabular-nums" style={{ color: palette.gold }}>
                ★ {faDigits(totalStars)}/{faDigits(maxStars)}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: hexAlpha(palette.cellGrid, 0.45) }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (save.unlockedLevel / GameBalanceConfig.TOTAL_LEVELS) * 100)}%`,
                  backgroundColor: palette.accent,
                }}
              />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={ctrl.startDaily}
          className="w-full min-h-[112px] flex flex-col justify-between gap-2.5 rounded-[20px] p-4 text-start transition-transform active:scale-[0.99] cursor-pointer"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.gold, 0.4)}`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[17px]" style={{ color: palette.onSurface }}>
                چالش روزانه
              </h3>
              <p className="text-xs mt-0.5" style={{ color: palette.onSurfaceMuted }}>
                پازل اختصاصی امروز · جایزه {faDigits(GameBalanceConfig.DAILY_REWARD_COINS)} سکه
              </p>
            </div>
            <span className="text-2xl leading-none" aria-hidden="true">
              🌟
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-medium" style={{ color: palette.gold }}>
              {save.daily.dayKey === today
                ? `بهترین امروز: ${groupedFa(save.daily.bestScore)}`
                : 'امروز هنوز بازی نکرده‌ای'}
            </span>
            <span
              className="font-bold"
              style={{
                color:
                  save.daily.dayKey === today && save.daily.rewardClaimed
                    ? palette.success
                    : palette.accent,
              }}
            >
              {save.daily.dayKey === today && save.daily.rewardClaimed ? 'جایزه گرفته شد ✓' : 'شروع چالش ‹'}
            </span>
          </div>
        </button>
      </div>

      {/* Rewarded Chest + Quick Shop Invite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ui.rewardedConfigured && (
          <div
            className="w-full rounded-[20px] p-3.5 flex items-center gap-3"
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${hexAlpha(palette.gold, 0.35)}`,
            }}
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow">
              <ArtImage
                src={trophyImg}
                alt="صندوق سکه رایگان"
                className="w-full h-full object-cover"
                fallbackIcon="💰"
                palette={palette}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-[14px]" style={{ color: palette.onSurface }}>
                  صندوق سکهٔ رایگان
                </h3>
                {ui.rewardedSimulated && <SimulatedBadge palette={palette} />}
              </div>
              <p className="text-[11px] leading-snug" style={{ color: palette.onSurfaceMuted }}>
                دریافت {faDigits(GameBalanceConfig.REWARDED_AD_COINS)} سکه با تبلیغ اختیاری
              </p>
            </div>
            <PrimaryButton
              text={`+${faDigits(GameBalanceConfig.REWARDED_AD_COINS)}`}
              onClick={ctrl.requestRewardedCoins}
              palette={palette}
              className="shrink-0 min-w-[78px] px-3"
            />
          </div>
        )}

        <button
          type="button"
          onClick={ctrl.openShop}
          className="w-full rounded-[20px] p-3.5 flex items-center justify-between gap-3 text-start cursor-pointer transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.gem, 0.42)}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: `linear-gradient(145deg, ${hexAlpha(palette.gem, 0.28)}, ${hexAlpha(palette.accent, 0.16)})`,
                border: `1px solid ${hexAlpha(palette.gem, 0.45)}`,
              }}
              aria-hidden="true"
            >
              💎
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-[14px]" style={{ color: palette.onSurface }}>
                فروشگاه پوسته‌ها و کافه‌بازار
              </h3>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: palette.onSurfaceMuted }}>
                ۸ پوستهٔ آرامش‌بخش، بسته‌های سکه و الماس + راهنمای خرج
              </p>
            </div>
          </div>
          <span className="text-lg font-bold shrink-0" style={{ color: palette.accent }}>
            ‹
          </span>
        </button>
      </div>

      {/* Compact Privacy & Offline info */}
      <div className="flex items-center justify-center gap-3 text-[11px] pt-1" style={{ color: palette.onSurfaceMuted }}>
        <span>ذخیرهٔ محلی روی دستگاه</span>
        <span>·</span>
        <button
          type="button"
          onClick={ctrl.openPrivacy}
          className="underline cursor-pointer hover:opacity-80 py-1"
          style={{ color: palette.accent }}
        >
          حریم خصوصی و داده‌ها
        </button>
      </div>
    </div>
  );
};
