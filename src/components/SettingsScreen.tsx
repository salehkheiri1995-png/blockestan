import React, { useState } from 'react';
import { GameController, GameUiState } from '../state/useGameController';
import { GamePalette } from '../theme/themes';
import { faDigits } from '../utils/fa';
import { TopBar } from './Components';

interface SettingsScreenProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ ui, ctrl, palette }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col min-h-full pb-8">
      <TopBar title="تنظیمات" onBack={ctrl.goHome} palette={palette} />

      <div className="px-3.5 py-2 flex flex-col gap-3">
        <SettingGroup palette={palette}>
          <SettingSwitch
            title="صدا"
            subtitle="صدای چیدن قطعه و پاک‌شدن خط"
            checked={ui.save.soundEnabled}
            onChange={ctrl.setSoundEnabled}
            palette={palette}
          />
          <SettingSwitch
            title="لرزش"
            subtitle="بازخورد لمسی کوتاه"
            checked={ui.save.vibrationEnabled}
            onChange={ctrl.setVibrationEnabled}
            palette={palette}
          />
          <SettingSwitch
            title="کاهش حرکت"
            subtitle="حذف انیمیشن‌های غیرضروری"
            checked={ui.save.reduceMotion}
            onChange={ctrl.setReduceMotion}
            palette={palette}
          />
        </SettingGroup>

        <SettingGroup palette={palette}>
          <SettingSwitch
            title="تبلیغ شخصی‌سازی‌شده"
            subtitle={
              ui.rewardedConfigured
                ? 'انتخاب شما در تنظیمات ذخیره می‌شود. رد این گزینه، تبلیغ را حذف نمی‌کند.'
                : 'تبلیغی پیکربندی نشده است.'
            }
            checked={ui.save.personalizedAdsConsent}
            enabled={ui.rewardedConfigured}
            onChange={ctrl.setPersonalizedConsent}
            palette={palette}
          />
          <p className="text-[11px] pt-1" style={{ color: palette.onSurfaceMuted }}>
            وضعیت تبلیغ: {ui.adStatusLabel}
          </p>
        </SettingGroup>

        <SettingGroup palette={palette}>
          <ActionRow title="حریم خصوصی و داده‌ها" onClick={ctrl.openPrivacy} palette={palette} />
          <ActionRow
            title="پاک‌کردن پیشرفت"
            onClick={() => setConfirmReset(true)}
            palette={palette}
            danger
          />
        </SettingGroup>

        <p className="text-[11px] text-center leading-relaxed py-3" style={{ color: palette.onSurfaceMuted }}>
          بلوکستان ۰.۱.۰
          <br />
          موتور بازی مستقل · {faDigits(60)} مرحلهٔ اعتبارسنجی‌شده
          <br />
          بدون حساب کاربری، سرور یا ابزار تحلیلی
        </p>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: palette.surfaceElevated }}
          >
            <h2 className="font-bold text-base" style={{ color: palette.onSurface }}>
              پاک‌کردن پیشرفت
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
              مرحله‌های بازشده، ستاره‌ها، رکورد و بازی نیمه‌تمام پاک می‌شوند. سکه‌ها و پوسته‌های خریداری‌شده باقی می‌مانند.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                style={{ color: palette.onSurface }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  ctrl.resetProgress();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ backgroundColor: palette.danger, color: '#FFFFFF' }}
              >
                پاک کن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingGroup: React.FC<{ palette: GamePalette; children: React.ReactNode }> = ({
  palette,
  children,
}) => (
  <div
    className="w-full rounded-[18px] px-3.5 py-2.5 flex flex-col gap-1.5"
    style={{ backgroundColor: palette.surface }}
  >
    {children}
  </div>
);

const SettingSwitch: React.FC<{
  title: string;
  subtitle: string;
  checked: boolean;
  enabled?: boolean;
  onChange: (checked: boolean) => void;
  palette: GamePalette;
}> = ({ title, subtitle, checked, enabled = true, onChange, palette }) => (
  <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
    <div className="flex-1">
      <div className="text-sm font-medium" style={{ color: palette.onSurface }}>
        {title}
      </div>
      <div className="text-[11px]" style={{ color: palette.onSurfaceMuted }}>
        {subtitle}
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={!enabled}
      onClick={() => onChange(!checked)}
      dir="ltr"
      className="w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
      style={{
        backgroundColor: checked ? palette.accent : palette.cellGrid,
      }}
    >
      <span
        className="block w-5 h-5 rounded-full transition-transform duration-150"
        style={{
          backgroundColor: checked ? palette.onAccent : palette.onSurface,
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
        }}
      />
    </button>
  </label>
);

const ActionRow: React.FC<{
  title: string;
  onClick: () => void;
  palette: GamePalette;
  danger?: boolean;
}> = ({ title, onClick, palette, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-start cursor-pointer hover:opacity-90"
    style={{ backgroundColor: palette.surfaceElevated }}
  >
    <span
      className="text-[13px] font-medium"
      style={{ color: danger ? palette.danger : palette.onSurface }}
    >
      {title}
    </span>
    <span className="text-lg leading-none" style={{ color: palette.onSurfaceMuted }}>
      ‹
    </span>
  </button>
);
