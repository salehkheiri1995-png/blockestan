import React, { useState } from 'react';
import trophyImg from '../assets/images/blockestan_trophy_reward_1794865544012.jpg';
import { BAZAAR_PRODUCTS, GameBalanceConfig } from '../engine/balance';
import { GameController, GameUiState } from '../state/useGameController';
import { GamePalette, GameThemes, hexAlpha } from '../theme/themes';
import { faDigits, groupedFa } from '../utils/fa';
import {
  ArtImage,
  CurrencyPairBadge,
  PrimaryButton,
  SectionCard,
  SimulatedBadge,
  TopBar,
} from './Components';

interface ShopScreenProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
}

type ShopTab = 'THEMES' | 'BAZAAR' | 'GUIDE';

export const ShopScreen: React.FC<ShopScreenProps> = ({ ui, ctrl, palette }) => {
  const [tab, setTab] = useState<ShopTab>('THEMES');

  const tabs: { id: ShopTab; label: string; icon: string }[] = [
    { id: 'THEMES', label: `پوسته‌ها (${faDigits(GameThemes.all.length)})`, icon: '🎨' },
    { id: 'BAZAAR', label: 'کافه‌بازار', icon: '💎' },
    { id: 'GUIDE', label: 'تبدیل و راهنما', icon: '🔄' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-full">
      <TopBar
        title="فروشگاه و کافه‌بازار"
        onBack={ctrl.goHome}
        palette={palette}
        trailing={
          <CurrencyPairBadge coins={ui.save.coins} gems={ui.save.gems} palette={palette} compact />
        }
      />

      <div className="px-3.5 sm:px-4 py-1 flex flex-col gap-4 pb-4">
        {/* Segmented Tab Bar */}
        <div
          className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.cellGrid, 0.4)}`,
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="min-h-[44px] rounded-xl px-2 flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? palette.accent : 'transparent',
                  color: active ? palette.onAccent : palette.onSurfaceMuted,
                }}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: 8 Calm Eye-Friendly Themes */}
        {tab === 'THEMES' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <div>
                <h2 className="font-bold text-base sm:text-lg" style={{ color: palette.onSurface }}>
                  ۸ پوستهٔ آرامش‌بخش و چشم‌نواز
                </h2>
                <p className="text-xs" style={{ color: palette.onSurfaceMuted }}>
                  پوسته‌های کلاسیک با سکه و پوسته‌های ویژه با الماس باز می‌شوند.
                </p>
              </div>
              <span
                className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-xl shrink-0"
                style={{
                  backgroundColor: hexAlpha(palette.accent, 0.16),
                  color: palette.accent,
                }}
              >
                {faDigits(ui.save.ownedThemes.length)} / {faDigits(GameThemes.all.length)} باز
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {GameThemes.all.map((theme) => {
                const owned = ui.save.ownedThemes.includes(theme.themeId);
                const selected = ui.save.selectedTheme === theme.themeId;
                const pricing = GameBalanceConfig.themePricing(theme.themeId);
                const isGemTheme = pricing.currency === 'GEMS';

                return (
                  <button
                    key={theme.themeId}
                    type="button"
                    onClick={() => ctrl.chooseTheme(theme.themeId)}
                    className="w-full flex flex-col gap-3 rounded-[22px] p-3.5 text-start cursor-pointer transition-transform active:scale-[0.98] shadow-sm"
                    style={{
                      backgroundColor: palette.surface,
                      border: `${selected ? '2px' : '1px'} solid ${
                        selected
                          ? palette.accent
                          : isGemTheme
                            ? hexAlpha(palette.gem, 0.45)
                            : hexAlpha(palette.cellGrid, 0.4)
                      }`,
                    }}
                  >
                    {/* Rich Mini Board + Gem Palette Preview */}
                    <div
                      className="w-full h-24 rounded-2xl p-2.5 flex items-center justify-between gap-3 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${theme.backgroundTop}, ${theme.backgroundBottom})`,
                        border: `1px solid ${hexAlpha(theme.cellGrid, 0.55)}`,
                      }}
                    >
                      {/* Mini 4x3 mosaic grid */}
                      <div
                        className="grid grid-cols-4 gap-1 p-1.5 rounded-xl shadow-inner"
                        style={{ backgroundColor: theme.boardBackground }}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                          const isEmpty = i === 2 || i === 5;
                          return (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-[5px]"
                              style={{
                                backgroundColor: isEmpty
                                  ? theme.cellEmpty
                                  : theme.pieceColors[i % theme.pieceColors.length],
                                boxShadow: isEmpty
                                  ? 'none'
                                  : 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -1.5px 0 rgba(0,0,0,0.22)',
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* 5 piece color gems + mode pill */}
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: hexAlpha(theme.surfaceElevated, 0.85),
                            color: theme.onSurface,
                          }}
                        >
                          {theme.dark ? 'شب آرام' : 'روز ملایم'}
                        </span>
                        <div className="flex items-center gap-1">
                          {theme.pieceColors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-md shadow"
                              style={{
                                backgroundColor: color,
                                boxShadow:
                                  'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1.5px 0 rgba(0,0,0,0.2)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Title, Subtitle & Action */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-[15px] truncate" style={{ color: palette.onSurface }}>
                          {theme.label}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: palette.onSurfaceMuted }}>
                          {theme.subtitle}
                        </div>
                      </div>
                      <span
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 tabular-nums"
                        style={{
                          backgroundColor: selected
                            ? hexAlpha(palette.accent, 0.2)
                            : owned
                              ? palette.surfaceElevated
                              : isGemTheme
                                ? palette.gem
                                : palette.accent,
                          color: selected
                            ? palette.accent
                            : owned
                              ? palette.onSurface
                              : isGemTheme
                                ? '#082F49'
                                : palette.onAccent,
                        }}
                      >
                        {selected
                          ? 'فعال ✓'
                          : owned
                            ? 'انتخاب'
                            : pricing.price === 0
                              ? 'رایگان'
                              : isGemTheme
                                ? `♦ ${faDigits(pricing.price)} الماس`
                                : `★ ${faDigits(pricing.price)} سکه`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Cafe Bazaar Coin & Diamond Packs + Rewarded Ad */}
        {tab === 'BAZAAR' && (
          <div className="flex flex-col gap-3.5">
            {/* Cafe Bazaar Header Info */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{
                backgroundColor: palette.surface,
                border: `1px solid ${hexAlpha('#10B981', 0.45)}`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  aria-hidden="true"
                >
                  ب
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-[15px]" style={{ color: palette.onSurface }}>
                      پرداخت درون‌برنامه‌ای کافه‌بازار
                    </h2>
                    {!ui.nativeBazaarConnected && <SimulatedBadge palette={palette} />}
                  </div>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: palette.onSurfaceMuted }}>
                    {ui.nativeBazaarConnected
                      ? 'متصل به درگاه رسمی کافه‌بازار (Poolakey)'
                      : 'در پیش‌نمایش وب به‌صورت آزمایشی تست می‌شود؛ در اندروید مستقیم به کافه‌بازار وصل است.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BAZAAR_PRODUCTS.map((product) => {
                const isGem = product.accentTone === 'gem';
                const isBundle = product.accentTone === 'bundle';
                const borderCol = isBundle
                  ? palette.accent
                  : isGem
                    ? palette.gem
                    : palette.gold;

                return (
                  <div
                    key={product.sku}
                    className="relative rounded-[22px] p-4 flex flex-col justify-between gap-3 shadow-sm"
                    style={{
                      backgroundColor: palette.surface,
                      border: `1px solid ${hexAlpha(borderCol, 0.5)}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[16px]" style={{ color: palette.onSurface }}>
                          {product.title}
                        </h3>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: palette.onSurfaceMuted }}>
                          {product.subtitle}
                        </p>
                      </div>
                      {product.badge && (
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{
                            backgroundColor: hexAlpha(borderCol, 0.2),
                            color: borderCol,
                          }}
                        >
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm font-bold tabular-nums py-1">
                      {product.coins > 0 && (
                        <span
                          className="px-2.5 py-1 rounded-xl"
                          style={{
                            backgroundColor: hexAlpha(palette.gold, 0.14),
                            color: palette.gold,
                          }}
                        >
                          ★ +{groupedFa(product.coins)} سکه
                        </span>
                      )}
                      {product.gems > 0 && (
                        <span
                          className="px-2.5 py-1 rounded-xl"
                          style={{
                            backgroundColor: hexAlpha(palette.gem, 0.16),
                            color: palette.gem,
                          }}
                        >
                          ♦ +{faDigits(product.gems)} الماس
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={ui.bazaarProcessing}
                      onClick={() => ctrl.startBazaarPurchase(product.sku)}
                      className="w-full min-h-[46px] rounded-2xl font-bold text-sm text-white cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-60 shadow"
                      style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}
                    >
                      خرید با کافه‌بازار · {groupedFa(product.priceToman)} تومان
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Free Rewarded Coins Card */}
            <SectionCard palette={palette}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow">
                  <ArtImage
                    src={trophyImg}
                    alt="صندوق سکه جایزه‌دار"
                    className="w-full h-full object-cover"
                    fallbackIcon="💰"
                    palette={palette}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1 text-center sm:text-start">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="font-bold text-[15px]" style={{ color: palette.onSurface }}>
                      دریافت سکهٔ رایگان با تبلیغ اختیاری
                    </h3>
                    {ui.rewardedSimulated && <SimulatedBadge palette={palette} />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
                    هر بار با انتخاب خودت +{faDigits(GameBalanceConfig.REWARDED_AD_COINS)} سکهٔ رایگان بگیر.
                  </p>
                </div>
                <PrimaryButton
                  text={`+${faDigits(GameBalanceConfig.REWARDED_AD_COINS)} سکه`}
                  disabled={!ui.rewardedConfigured}
                  onClick={ctrl.requestRewardedCoins}
                  palette={palette}
                  className="w-full sm:w-auto shrink-0"
                />
              </div>
            </SectionCard>
          </div>
        )}

        {/* TAB 3: Gem-to-Coin Exchange & Full Economy Spend Guide */}
        {tab === 'GUIDE' && (
          <div className="flex flex-col gap-3.5">
            {/* Gem -> Coin Exchange Card */}
            <SectionCard palette={palette}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-start">
                  <h2 className="font-bold text-base" style={{ color: palette.onSurface }}>
                    تبدیل الماس به سکه
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
                    هر {faDigits(GameBalanceConfig.GEM_TO_COINS_COST)} الماس را می‌توانی فوری به{' '}
                    {faDigits(GameBalanceConfig.GEM_TO_COINS_AMOUNT)} سکه تبدیل کنی تا برای چکش، بازگشت حرکت یا پوسته‌های سکه‌ای خرج کنی.
                  </p>
                </div>
                <PrimaryButton
                  text={`${faDigits(GameBalanceConfig.GEM_TO_COINS_COST)} الماس ← ${faDigits(
                    GameBalanceConfig.GEM_TO_COINS_AMOUNT
                  )} سکه`}
                  onClick={ctrl.exchangeGemsForCoins}
                  palette={palette}
                  className="w-full sm:w-auto shrink-0"
                />
              </div>
            </SectionCard>

            {/* How Coins & Diamonds Work */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SectionCard palette={palette}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg" aria-hidden="true">
                    ★
                  </span>
                  <h3 className="font-bold text-[15px]" style={{ color: palette.gold }}>
                    سکه چطور به دست می‌آید و خرج می‌شود؟
                  </h3>
                </div>
                <ul className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: palette.onSurface }}>
                  <li>
                    <strong>کسب سکه:</strong> برد اول هر مرحله (+{faDigits(GameBalanceConfig.FIRST_LEVEL_WIN_COINS)}),
                    چالش روزانه (+{faDigits(GameBalanceConfig.DAILY_REWARD_COINS)}), پایان هر فصل (+
                    {faDigits(GameBalanceConfig.CHAPTER_COMPLETE_COINS)}), تبلیغ اختیاری و کافه‌بازار.
                  </li>
                  <li>
                    <strong>تقویت‌کننده‌های داخل بازی:</strong> بازگشت حرکت ({faDigits(GameBalanceConfig.UNDO_COST)} سکه)، تعویض قطعات ({faDigits(GameBalanceConfig.SWAP_COST)} سکه)، چکش ۳×۳ ({faDigits(GameBalanceConfig.HAMMER_COST)} سکه).
                  </li>
                  <li>
                    <strong>ادامه دادن در بن‌بست:</strong> آزادکردن فضا با {faDigits(GameBalanceConfig.CONTINUE_COST)} سکه.
                  </li>
                  <li>
                    <strong>خرید پوسته‌های کلاسیک:</strong> بازکردن ۵ پوستهٔ زیبا از ۲۵۰ تا ۶۵۰ سکه.
                  </li>
                </ul>
              </SectionCard>

              <SectionCard palette={palette}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg" aria-hidden="true">
                    💎
                  </span>
                  <h3 className="font-bold text-[15px]" style={{ color: palette.gem }}>
                    الماس به چه دردی می‌خورد؟
                  </h3>
                </div>
                <ul className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: palette.onSurface }}>
                  <li>
                    <strong>کسب الماس:</strong> گرفتن ۳ ستاره در هر مرحله (+{faDigits(GameBalanceConfig.LEVEL_THREE_STAR_BONUS_GEMS)} الماس)، کامل‌کردن هر فصل داستان (+{faDigits(GameBalanceConfig.CHAPTER_COMPLETE_GEMS)} الماس) و بسته‌های کافه‌بازار.
                  </li>
                  <li>
                    <strong>پوسته‌های کمیاب الماسی:</strong> بازکردن «شفق گل‌بهی» (۱۲ الماس) و «تاج لاجوردی» (۲۰ الماس).
                  </li>
                  <li>
                    <strong>ادامهٔ فوری بازی:</strong> وقتی جایت پر شد فقط با {faDigits(GameBalanceConfig.CONTINUE_GEM_COST)} الماس بازی را نجات بده!
                  </li>
                  <li>
                    <strong>تبدیل به سکه:</strong> تبدیل {faDigits(GameBalanceConfig.GEM_TO_COINS_COST)} الماس به {faDigits(GameBalanceConfig.GEM_TO_COINS_AMOUNT)} سکه در همین صفحه.
                  </li>
                </ul>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
