import React from 'react';
import { AdUi, RewardPurpose } from '../state/useGameController';
import { GamePalette } from '../theme/themes';

/**
 * Lightweight overlay shown while an ad is being prepared.
 *
 * - On the web build it marks the simulated ad flow.
 * - On Android it covers the short moment before the real Tapsell video opens; the Tapsell
 *   player takes over the screen once the video is ready.
 */
export const AdOverlay: React.FC<{ ad: AdUi; palette: GamePalette }> = ({ ad, palette }) => {
  if (!ad.showing) return null;

  const simulated = ad.simulated;

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
          {simulated ? 'تبلیغ شبیه‌سازی‌شده' : 'در حال آماده‌سازی ویدیو'}
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
          {simulated
            ? 'این نسخهٔ آزمایشی است؛ تبلیغ واقعی نمایش داده نمی‌شود و هیچ درآمدی ایجاد نمی‌کند. جایزه فقط به‌صورت آزمایشی اضافه می‌شود.'
            : 'ویدیوی جایزه‌دار در حال باز شدن است. برای دریافت جایزه باید تماشای ویدیو را کامل کنی؛ بستن زودهنگام جایزه‌ای ندارد.'}
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
