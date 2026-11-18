import { useEffect } from 'react';
import { BazaarCheckoutModal } from './components/BazaarCheckoutModal';
import { BottomNav } from './components/BottomNav';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { PrivacyScreen } from './components/PrivacyScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ShopScreen } from './components/ShopScreen';
import { AdOverlay } from './components/AdOverlay';
import { StoryModal } from './components/StoryModal';
import { activeStoryChapter } from './data/story';
import {
  hideBannerAd,
  initializeAds,
  isNativeAdsAvailable,
  showBannerAd,
} from './services/tapsellAds';
import { Screen, useGameController } from './state/useGameController';
import { GameThemes, hexAlpha } from './theme/themes';

export function App() {
  const ctrl = useGameController();
  const { ui } = ctrl;
  const palette = GameThemes.byId(ui.save.selectedTheme);
  const ambientChapter = activeStoryChapter(ui.save.unlockedLevel);

  const showNav = ui.screen !== Screen.GAME && ui.screen !== Screen.PRIVACY;

  // Tapsell: warm the SDK up once, then keep the standard banner on menu screens only so the
  // board stays unobstructed while playing.
  useEffect(() => {
    void initializeAds();
  }, []);

  useEffect(() => {
    if (!isNativeAdsAvailable()) return;
    if (showNav) {
      void showBannerAd();
    } else {
      void hideBannerAd();
    }
  }, [showNav]);

  return (
    <div
      dir="rtl"
      className={`min-h-[100dvh] w-full flex flex-col relative overflow-x-hidden ${
        ui.save.reduceMotion ? 'reduce-motion' : ''
      }`}
      style={{
        background: `linear-gradient(180deg, ${palette.backgroundTop} 0%, ${palette.backgroundBottom} 100%)`,
        color: palette.onSurface,
      }}
    >
      {/* Soothing ambient world illustration behind menus */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={ambientChapter.image}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105 opacity-25 blur-[2px]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${hexAlpha(palette.backgroundTop, 0.78)} 0%, ${hexAlpha(palette.backgroundBottom, 0.90)} 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 flex-1 w-full flex flex-col">
        {showNav && <BottomNav current={ui.screen} ctrl={ctrl} palette={palette} />}

        <main
          className={`flex-1 w-full flex flex-col ${
            showNav ? 'pb-[calc(6rem+var(--ad-banner-h,0px))] lg:pb-6' : ''
          }`}
        >
          {ui.screen === Screen.HOME && <HomeScreen ui={ui} ctrl={ctrl} palette={palette} />}
          {ui.screen === Screen.LEVELS && <LevelsScreen ui={ui} ctrl={ctrl} palette={palette} />}
          {ui.screen === Screen.GAME && <GameScreen ui={ui} ctrl={ctrl} palette={palette} />}
          {ui.screen === Screen.SHOP && <ShopScreen ui={ui} ctrl={ctrl} palette={palette} />}
          {ui.screen === Screen.SETTINGS && <SettingsScreen ui={ui} ctrl={ctrl} palette={palette} />}
          {ui.screen === Screen.PRIVACY && <PrivacyScreen ctrl={ctrl} palette={palette} />}
        </main>
      </div>

      {/* Snackbar positioned safely above Android thumb-zone BottomNav */}
      {ui.snack && (
        <div
          className="fixed left-4 right-4 z-50 flex justify-center pointer-events-none"
          style={{ bottom: showNav ? 'calc(5rem + var(--ad-banner-h, 0px))' : 'calc(1rem + var(--ad-banner-h, 0px))' }}
        >
          <div
            className="w-full max-w-md rounded-[14px] px-3.5 py-3 flex items-center justify-between gap-3 shadow-lg pointer-events-auto"
            style={{ backgroundColor: palette.surfaceElevated }}
          >
            <span className="text-xs flex-1" style={{ color: palette.onSurface }}>
              {ui.snack}
            </span>
            <button
              type="button"
              onClick={ctrl.dismissSnack}
              className="px-2 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0"
              style={{ color: palette.accent }}
            >
              بستن
            </button>
          </div>
        </div>
      )}

      <StoryModal
        chapter={ui.activeStoryModal}
        palette={palette}
        onClose={ctrl.dismissStoryModal}
      />

      <BazaarCheckoutModal
        product={ui.pendingBazaarProduct}
        processing={ui.bazaarProcessing}
        palette={palette}
        onConfirm={ctrl.confirmSandboxBazaarPurchase}
        onCancel={ctrl.cancelSandboxBazaarPurchase}
      />

      <AdOverlay ad={ui.ad} palette={palette} />
    </div>
  );
}

export default App;
