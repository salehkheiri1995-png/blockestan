import React from 'react';
import { AdUi, RewardPurpose } from '../state/useGameController';
import { GamePalette } from '../theme/themes';

export const SimulatedAdOverlay: React.FC<{ ad: AdUi; palette: GamePalette }> = ({ ad, palette }) => {
  if (!ad.showing || !ad.simulated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-sm rounded-[22px] p-6 flex flex-col items-center gap-3 text-center shadow-2xl"
        style={{ backgroundColor: palette.surfaceElevated }}
      >
        <div
          className="w-9 h-9 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${palette.accent} transparent ${palette.accent} ${palette.accent}` }}
        />
        <h2 className="font-bold text-lg" style={{ color: palette.onSurface }}>
          تبلیغ شبیه‌سازی‌شده
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
          این نسخهٔ آزمایشی است؛ تبلیغ واقعی نمایش داده نمی‌شود و هیچ درآمدی ایجاد نمی‌کند. جایزه فقط به‌صورت آزمایشی اضافه می‌شود.
        </p>
        <span className="text-[11px] font-medium" style={{ color: palette.accent }}>
          {ad.purpose === RewardPurpose.CONTINUE
            ? 'در حال آماده‌سازی ادامهٔ بازی…'
            : 'در حال آماده‌سازی جایزه…'}
        </span>
      </div>
    </div>
  );
};
