import React, { useEffect, useState } from 'react';
import mascotImg from '../assets/images/blockestan_hero_mascot_1794865543635.jpg';
import { StoryChapter } from '../data/story';
import { GameBalanceConfig } from '../engine/balance';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits } from '../utils/fa';
import { ArtImage, PrimaryButton } from './Components';

interface StoryModalProps {
  chapter: StoryChapter | null;
  palette: GamePalette;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ chapter, palette, onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
  }, [chapter?.id]);

  if (!chapter) return null;

  const lines = chapter.dialogue;
  const activeLine = lines[Math.min(step, lines.length - 1)];
  const isLast = step >= lines.length - 1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={chapter.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col"
        style={{
          backgroundColor: palette.surfaceElevated,
          border: `1px solid ${hexAlpha(palette.accent, 0.4)}`,
        }}
      >
        {/* Chapter Illustration Header */}
        <div className="relative h-40 sm:h-48 w-full shrink-0">
          <ArtImage
            src={chapter.image}
            alt={chapter.title}
            className="w-full h-full object-cover"
            fallbackIcon="🏰"
            palette={palette}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(6, 18, 22, 0.15) 0%, rgba(6, 18, 22, 0.88) 100%)',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن داستان"
            className="absolute top-3 left-3 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-sm font-bold cursor-pointer bg-black/50 text-white"
          >
            ✕
          </button>
          <div className="absolute bottom-3 right-4 left-4 flex flex-col gap-0.5">
            <span className="text-[11px] font-bold" style={{ color: palette.gold }}>
              {chapter.landmark}
            </span>
            <h2 className="font-bold text-lg sm:text-xl text-white leading-snug">
              {chapter.title}
            </h2>
            <p className="text-[11px] text-slate-200">{chapter.subtitle}</p>
          </div>
        </div>

        {/* Mascot Dialogue Box */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div
            className="rounded-2xl p-3.5 flex items-start gap-3"
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${hexAlpha(palette.accent, 0.3)}`,
            }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 shadow"
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
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold" style={{ color: palette.accent }}>
                  {activeLine.speaker}
                </span>
                <span className="text-[10px]" style={{ color: palette.onSurfaceMuted }}>
                  {faDigits(step + 1)} / {faDigits(lines.length)}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: palette.onSurface }}>
                {activeLine.text}
              </p>
            </div>
          </div>

          {/* Chapter Goal + Reward summary */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: hexAlpha(palette.gold, 0.1),
              border: `1px solid ${hexAlpha(palette.gold, 0.3)}`,
            }}
          >
            <span className="leading-snug" style={{ color: palette.onSurface }}>
              {chapter.objectiveSummary}
            </span>
            <span className="font-bold shrink-0 tabular-nums" style={{ color: palette.gold }}>
              +{faDigits(GameBalanceConfig.CHAPTER_COMPLETE_GEMS)} الماس
            </span>
          </div>

          {/* Step Dots + CTA */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              {lines.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`بخش ${faDigits(i + 1)}`}
                  className="h-2 rounded-full transition-all cursor-pointer"
                  style={{
                    width: i === step ? '22px' : '8px',
                    backgroundColor: i === step ? palette.accent : hexAlpha(palette.cellGrid, 0.6),
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-3 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ color: palette.onSurfaceMuted }}
                >
                  رد کردن
                </button>
              )}
              <PrimaryButton
                text={isLast ? 'شروع بازی!' : 'ادامهٔ داستان ←'}
                onClick={() => {
                  if (isLast) onClose();
                  else setStep((s) => s + 1);
                }}
                palette={palette}
                className="min-w-[138px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
