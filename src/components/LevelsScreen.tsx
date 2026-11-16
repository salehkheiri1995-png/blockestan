import React from 'react';
import mascotImg from '../assets/images/blockestan_hero_mascot_1794865543635.jpg';
import { activeStoryChapter, chapterSolvedCount, isChapterCompleted, STORY_CHAPTERS } from '../data/story';
import { GameBalanceConfig } from '../engine/balance';
import { LevelCatalog } from '../engine/levelCatalog';
import { Difficulty } from '../engine/models';
import { GameController, GameUiState } from '../state/useGameController';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits } from '../utils/fa';
import { ArtImage, CurrencyPairBadge, StarRow, TopBar } from './Components';

interface LevelsScreenProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
}

const difficultyLabel = (d: Difficulty): string => {
  switch (d) {
    case Difficulty.EASY:
      return 'آسان';
    case Difficulty.NORMAL:
      return 'متوسط';
    case Difficulty.HARD:
      return 'سخت';
  }
};

export const LevelsScreen: React.FC<LevelsScreenProps> = ({ ui, ctrl, palette }) => {
  const totalStars = Object.values(ui.save.levelStars).reduce((sum, s) => sum + s, 0);
  const currentChapter = activeStoryChapter(ui.save.unlockedLevel);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-full">
      <TopBar
        title="نقشهٔ داستان و مراحل"
        onBack={ctrl.goHome}
        palette={palette}
        trailing={
          <CurrencyPairBadge
            coins={ui.save.coins}
            gems={ui.save.gems}
            palette={palette}
            compact
            onClick={ctrl.openShop}
          />
        }
      />

      {/* Firooz Warm Companion Strip */}
      <div className="px-3.5 sm:px-4 flex flex-col gap-3 pb-2">
        <div
          className="rounded-[22px] p-3.5 flex items-center justify-between gap-3 shadow-sm"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.accent, 0.35)}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow"
              style={{ border: `2px solid ${palette.accent}` }}
            >
              <ArtImage
                src={mascotImg}
                alt="فیروز"
                className="w-full h-full object-cover"
                fallbackIcon="🧩"
                palette={palette}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold" style={{ color: palette.accent }}>
                فیروز در {currentChapter.shortTitle}:
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
                {currentChapter.tipFromFirooz} با ۳ ستاره <strong style={{ color: palette.gem }}>+۱ الماس</strong> می‌گیری!
              </p>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <div className="text-sm font-bold tabular-nums" style={{ color: palette.gold }}>
              ★ {faDigits(totalStars)}/{faDigits(GameBalanceConfig.TOTAL_LEVELS * 3)}
            </div>
            <div className="text-[11px] tabular-nums" style={{ color: palette.accent }}>
              {faDigits(ui.save.unlockedLevel)}/{faDigits(GameBalanceConfig.TOTAL_LEVELS)} باز
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Sanctuaries */}
      <div className="px-3.5 sm:px-4 flex flex-col gap-5 pt-1 pb-4">
        {STORY_CHAPTERS.map((chapter) => {
          const levels = LevelCatalog.levels.filter(
            (l) => l.id >= chapter.levelFrom && l.id <= chapter.levelTo
          );
          const solved = chapterSolvedCount(chapter, ui.save.levelStars);
          const completed = isChapterCompleted(chapter, ui.save.levelStars);
          const chapterUnlocked = ui.save.unlockedLevel >= chapter.levelFrom;

          return (
            <section
              key={chapter.id}
              className="rounded-[26px] p-3 flex flex-col gap-3 shadow-sm"
              style={{
                backgroundColor: hexAlpha(palette.surface, 0.72),
                border: `1px solid ${
                  completed
                    ? hexAlpha(palette.success, 0.5)
                    : chapterUnlocked
                      ? hexAlpha(palette.accent, 0.35)
                      : hexAlpha(palette.cellGrid, 0.3)
                }`,
              }}
            >
              {/* Illustrated Story Chapter Banner */}
              <div className="relative w-full rounded-[20px] overflow-hidden shadow-md">
                <ArtImage
                  src={chapter.image}
                  alt={chapter.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  fallbackIcon="🗺️"
                  palette={palette}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(6, 18, 22, 0.62) 0%, rgba(6, 18, 22, 0.88) 65%, rgba(6, 18, 22, 0.94) 100%)',
                  }}
                />
                <div className="relative z-10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-white">{chapter.title}</h2>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                        style={{
                          backgroundColor: completed
                            ? hexAlpha(palette.success, 0.25)
                            : 'rgba(255,255,255,0.16)',
                          color: completed ? palette.success : '#F8FAFC',
                        }}
                      >
                        {completed
                          ? 'تکمیل شد ✓'
                          : `${faDigits(solved)} / ${faDigits(levels.length)} مرحله`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200">{chapter.objectiveSummary}</p>
                    <span className="text-[11px] font-medium" style={{ color: palette.gold }}>
                      پاداش فصل: +{faDigits(GameBalanceConfig.CHAPTER_COMPLETE_GEMS)} الماس و +
                      {faDigits(GameBalanceConfig.CHAPTER_COMPLETE_COINS)} سکه{' '}
                      {ui.save.claimedStoryRewards.includes(chapter.id) ? '(دریافت شد ✓)' : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => ctrl.openStoryChapter(chapter.id)}
                    className="min-h-[40px] px-3.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 self-start sm:self-center transition-transform active:scale-95"
                    style={{
                      backgroundColor: palette.accent,
                      color: palette.onAccent,
                    }}
                  >
                    📖 داستان فصل
                  </button>
                </div>
              </div>

              {/* Warm Mosaic Level Medallions */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {levels.map((level) => {
                  const unlocked = level.id <= ui.save.unlockedLevel;
                  const isNextFrontier = level.id === ui.save.unlockedLevel;
                  const stars = ui.save.levelStars[level.id] ?? 0;
                  const accent =
                    level.difficulty === Difficulty.EASY
                      ? palette.success
                      : level.difficulty === Difficulty.NORMAL
                        ? palette.accent
                        : palette.danger;

                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => ctrl.startLevel(level.id)}
                      className="relative min-h-[72px] rounded-2xl p-1.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95 hover:scale-[1.03]"
                      style={{
                        background: isNextFrontier
                          ? `linear-gradient(155deg, ${hexAlpha(accent, 0.34)}, ${hexAlpha(palette.gold, 0.2)})`
                          : unlocked
                            ? `linear-gradient(155deg, ${palette.surfaceElevated}, ${palette.surface})`
                            : hexAlpha(palette.boardBackground, 0.55),
                        border: `${isNextFrontier ? '2px' : '1px'} solid ${
                          isNextFrontier
                            ? palette.gold
                            : unlocked
                              ? stars === 3
                                ? hexAlpha(palette.gold, 0.6)
                                : hexAlpha(accent, 0.45)
                              : hexAlpha(palette.cellGrid, 0.25)
                        }`,
                        boxShadow: isNextFrontier
                          ? `0 4px 14px ${hexAlpha(palette.gold, 0.25)}`
                          : unlocked
                            ? 'inset 0 -2px 0 rgba(0,0,0,0.18)'
                            : 'none',
                      }}
                    >
                      <span
                        className={`font-bold tabular-nums leading-none ${
                          unlocked ? 'text-[18px]' : 'text-[11px]'
                        }`}
                        style={{ color: unlocked ? palette.onSurface : palette.onSurfaceMuted }}
                      >
                        {unlocked ? faDigits(level.id) : 'قفل'}
                      </span>
                      {unlocked ? (
                        <>
                          <StarRow stars={stars} palette={palette} size={11} />
                          <span
                            className="text-[10px] font-bold leading-none"
                            style={{ color: isNextFrontier ? palette.gold : accent }}
                          >
                            {isNextFrontier ? 'شروع!' : difficultyLabel(level.difficulty)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs opacity-65" aria-hidden="true">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
