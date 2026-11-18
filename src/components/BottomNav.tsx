import React from 'react';
import { GameController, Screen } from '../state/useGameController';
import { GamePalette, hexAlpha } from '../theme/themes';

interface BottomNavProps {
  current: Screen;
  ctrl: GameController;
  palette: GamePalette;
}

export const BottomNav: React.FC<BottomNavProps> = ({ current, ctrl, palette }) => {
  const tabs = [
    { id: Screen.HOME, label: 'خانه', icon: '🏠', action: ctrl.goHome },
    { id: Screen.LEVELS, label: 'داستان و مراحل', icon: '🗺️', action: ctrl.openLevels },
    { id: Screen.SHOP, label: 'فروشگاه', icon: '💎', action: ctrl.openShop },
    { id: Screen.SETTINGS, label: 'تنظیمات', icon: '⚙️', action: ctrl.openSettings },
  ];

  return (
    <>
      {/* Android Mobile Thumb-Zone Bottom Bar */}
      <nav
        aria-label="منوی اصلی"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-2.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md"
        style={{
          bottom: 'var(--ad-banner-h, 0px)',
          backgroundColor: hexAlpha(palette.surfaceElevated, 0.94),
          borderTop: `1px solid ${hexAlpha(palette.cellGrid, 0.45)}`,
          boxShadow: '0 -6px 22px rgba(0, 0, 0, 0.22)',
        }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const active = current === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action}
                aria-current={active ? 'page' : undefined}
                className="min-h-[48px] rounded-2xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-transform active:scale-95"
                style={{
                  backgroundColor: active ? hexAlpha(palette.accent, 0.16) : 'transparent',
                  color: active ? palette.accent : palette.onSurfaceMuted,
                }}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="text-[11px] font-bold leading-tight truncate max-w-full px-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top Strip Nav */}
      <nav
        aria-label="ناوبری دسکتاپ"
        className="hidden lg:flex w-full max-w-4xl mx-auto px-4 pt-3 items-center justify-between gap-3"
      >
        <div
          className="w-full rounded-2xl p-1.5 grid grid-cols-4 gap-1.5"
          style={{
            backgroundColor: hexAlpha(palette.surface, 0.85),
            border: `1px solid ${hexAlpha(palette.cellGrid, 0.4)}`,
          }}
        >
          {tabs.map((tab) => {
            const active = current === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action}
                className="min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? palette.accent : 'transparent',
                  color: active ? palette.onAccent : palette.onSurfaceMuted,
                }}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
