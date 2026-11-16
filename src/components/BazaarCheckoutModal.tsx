import React from 'react';
import { BazaarProduct } from '../engine/balance';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits, groupedFa } from '../utils/fa';

interface BazaarCheckoutModalProps {
  product: BazaarProduct | null;
  processing: boolean;
  palette: GamePalette;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BazaarCheckoutModal: React.FC<BazaarCheckoutModalProps> = ({
  product,
  processing,
  palette,
  onConfirm,
  onCancel,
}) => {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="پرداخت کافه‌بازار"
    >
      <div
        className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 flex flex-col gap-4 shadow-2xl"
        style={{
          backgroundColor: palette.surfaceElevated,
          border: `1px solid ${hexAlpha('#10B981', 0.45)}`,
        }}
      >
        {/* Bazaar Styled Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              aria-hidden="true"
            >
              ب
            </span>
            <div>
              <h2 className="font-bold text-base" style={{ color: palette.onSurface }}>
                درگاه پرداخت کافه‌بازار
              </h2>
              <p className="text-[11px]" style={{ color: palette.onSurfaceMuted }}>
                پرداخت درون‌برنامه‌ای امن بلوکستان
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: hexAlpha('#10B981', 0.16),
              color: '#34D399',
            }}
          >
            محیط آزمایشی وب
          </span>
        </div>

        {/* Product Summary Card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.cellGrid, 0.45)}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[15px]" style={{ color: palette.onSurface }}>
              {product.title}
            </span>
            <span className="font-bold text-sm tabular-nums" style={{ color: '#34D399' }}>
              {groupedFa(product.priceToman)} تومان
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: palette.onSurfaceMuted }}>
            {product.subtitle}
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs font-bold tabular-nums">
            {product.coins > 0 && (
              <span style={{ color: palette.gold }}>★ +{groupedFa(product.coins)} سکه</span>
            )}
            {product.gems > 0 && (
              <span style={{ color: palette.gem }}>♦ +{faDigits(product.gems)} الماس</span>
            )}
          </div>
          <span className="text-[10px] font-mono opacity-60" dir="ltr">
            SKU: {product.sku}
          </span>
        </div>

        <p
          className="text-[11px] leading-relaxed rounded-xl px-3 py-2"
          style={{
            backgroundColor: hexAlpha(palette.gold, 0.1),
            color: palette.onSurfaceMuted,
          }}
        >
          توضیح شفاف: در پیش‌نمایش مرورگر وب، این تراکنش به‌صورت آزمایشی شبیه‌سازی می‌شود و پرداخت بانکی واقعی انجام نمی‌گیرد؛ در نسخهٔ اندروید مستقیماً به کتابخانهٔ کافه‌بازار (Poolakey) متصل است.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={processing}
            onClick={onConfirm}
            className="flex-1 min-h-[48px] rounded-2xl font-bold text-sm text-white cursor-pointer disabled:opacity-60 transition-transform active:scale-[0.99] shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}
          >
            {processing ? 'در حال ثبت در کافه‌بازار...' : `تأیید آزمایشی و دریافت (${groupedFa(product.priceToman)} ت)`}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onCancel}
            className="min-h-[46px] px-5 rounded-2xl font-medium text-sm cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: palette.surface,
              color: palette.onSurface,
              border: `1px solid ${palette.cellGrid}`,
            }}
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
