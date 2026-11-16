import React, { useState } from 'react';
import { PieceShape } from '../engine/models';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits, groupedFa } from '../utils/fa';

export const ArtImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  palette: GamePalette;
}> = ({ src, alt, className = '', fallbackIcon = '🧩', palette }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center select-none ${className}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${hexAlpha(palette.accent, 0.35)}, ${palette.surfaceElevated})`,
        }}
        role="img"
        aria-label={alt}
      >
        <span className="text-3xl">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const CoinBadge: React.FC<{
  coins: number;
  palette: GamePalette;
  compact?: boolean;
  onClick?: () => void;
}> = ({ coins, palette, compact = false, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`inline-flex items-center gap-1.5 rounded-full shrink-0 shadow-sm ${
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
      } ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      style={{
        backgroundColor: palette.surfaceElevated,
        border: `1px solid ${hexAlpha(palette.gold, 0.45)}`,
      }}
    >
      <span
        className={`${compact ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]'} rounded-full shrink-0 flex items-center justify-center font-bold`}
        style={{
          background: `linear-gradient(145deg, #FEF08A, ${palette.gold})`,
          color: '#422006',
          boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.25)',
        }}
        aria-hidden="true"
      >
        ★
      </span>
      <span
        className={`font-bold tabular-nums ${compact ? 'text-[13px]' : 'text-[14px]'}`}
        style={{ color: palette.onSurface }}
      >
        {groupedFa(coins)}
      </span>
      {!compact && (
        <span className="text-[11px]" style={{ color: palette.onSurfaceMuted }}>
          سکه
        </span>
      )}
    </Tag>
  );
};

export const GemBadge: React.FC<{
  gems: number;
  palette: GamePalette;
  compact?: boolean;
  onClick?: () => void;
}> = ({ gems, palette, compact = false, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`inline-flex items-center gap-1.5 rounded-full shrink-0 shadow-sm ${
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
      } ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      style={{
        backgroundColor: palette.surfaceElevated,
        border: `1px solid ${hexAlpha(palette.gem, 0.48)}`,
      }}
    >
      <span
        className={`${compact ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[11px]'} rounded-md rotate-45 shrink-0 flex items-center justify-center font-bold`}
        style={{
          background: `linear-gradient(145deg, #CFFAFE, ${palette.gem})`,
          color: '#083344',
          boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.22)',
        }}
        aria-hidden="true"
      >
        <span className="-rotate-45 leading-none">♦</span>
      </span>
      <span
        className={`font-bold tabular-nums ${compact ? 'text-[13px]' : 'text-[14px]'}`}
        style={{ color: palette.onSurface }}
      >
        {groupedFa(gems)}
      </span>
      {!compact && (
        <span className="text-[11px]" style={{ color: palette.onSurfaceMuted }}>
          الماس
        </span>
      )}
    </Tag>
  );
};

export const CurrencyPairBadge: React.FC<{
  coins: number;
  gems: number;
  palette: GamePalette;
  compact?: boolean;
  onClick?: () => void;
}> = ({ coins, gems, palette, compact = false, onClick }) => (
  <div className="inline-flex items-center gap-1.5 shrink-0">
    <CoinBadge coins={coins} palette={palette} compact={compact} onClick={onClick} />
    <GemBadge gems={gems} palette={palette} compact={compact} onClick={onClick} />
  </div>
);

export const PrimaryButton: React.FC<{
  text: string;
  onClick: () => void;
  palette: GamePalette;
  disabled?: boolean;
  className?: string;
}> = ({ text, onClick, palette, disabled = false, className = '' }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`min-h-[48px] px-5 rounded-2xl font-bold text-[15px] transition-transform active:translate-y-[1px] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap ${className}`}
    style={{
      backgroundColor: disabled ? palette.surfaceElevated : palette.accent,
      color: disabled ? palette.onSurfaceMuted : palette.onAccent,
      opacity: disabled ? 0.65 : 1,
      boxShadow: disabled ? 'none' : 'inset 0 -3px 0 rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.18)',
    }}
  >
    {text}
  </button>
);

export const SecondaryButton: React.FC<{
  text: string;
  onClick: () => void;
  palette: GamePalette;
  disabled?: boolean;
  className?: string;
}> = ({ text, onClick, palette, disabled = false, className = '' }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`min-h-[44px] px-4 rounded-[14px] font-medium text-[14px] transition-transform active:translate-y-[1px] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap ${className}`}
    style={{
      backgroundColor: hexAlpha(palette.surface, 0.72),
      color: palette.onSurface,
      border: `1px solid ${palette.cellGrid}`,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {text}
  </button>
);

export const SectionCard: React.FC<{
  palette: GamePalette;
  children: React.ReactNode;
  className?: string;
}> = ({ palette, children, className = '' }) => (
  <div
    className={`w-full rounded-[20px] p-4 ${className}`}
    style={{
      backgroundColor: palette.surface,
      border: `1px solid ${hexAlpha(palette.cellGrid, 0.35)}`,
    }}
  >
    {children}
  </div>
);

export const TopBar: React.FC<{
  title: string;
  onBack: () => void;
  palette: GamePalette;
  trailing?: React.ReactNode;
}> = ({ title, onBack, palette, trailing }) => (
  <div className="w-full flex items-center gap-2 px-3 py-2.5">
    <button
      type="button"
      onClick={onBack}
      aria-label="بازگشت"
      className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[20px] leading-none cursor-pointer transition-opacity hover:opacity-80 shrink-0"
      style={{
        color: palette.onSurface,
        backgroundColor: hexAlpha(palette.surface, 0.75),
        border: `1px solid ${hexAlpha(palette.cellGrid, 0.35)}`,
      }}
    >
      →
    </button>
    <h1
      className="flex-1 font-bold text-[17px] sm:text-[18px] truncate text-start"
      style={{ color: palette.onSurface }}
    >
      {title}
    </h1>
    {trailing}
  </div>
);

export const StarRow: React.FC<{
  stars: number;
  palette: GamePalette;
  size?: number;
  dim?: boolean;
}> = ({ stars, palette, size = 18, dim = false }) => (
  <div className="inline-flex items-center gap-0.5" dir="ltr" aria-label={`${faDigits(stars)} ستاره`}>
    {[0, 1, 2].map((idx) => (
      <span
        key={idx}
        style={{
          fontSize: `${size}px`,
          lineHeight: 1,
          color:
            idx < stars
              ? palette.gold
              : dim
                ? hexAlpha(palette.cellGrid, 0.5)
                : palette.cellGrid,
          textShadow: idx < stars ? `0 2px 6px ${hexAlpha(palette.gold, 0.45)}` : 'none',
        }}
      >
        ★
      </span>
    ))}
  </div>
);

export const StatPill: React.FC<{
  label: string;
  value: string;
  palette: GamePalette;
}> = ({ label, value, palette }) => (
  <div
    className="flex flex-col items-center rounded-[14px] px-3.5 py-2 min-w-[74px]"
    style={{
      backgroundColor: palette.surface,
      border: `1px solid ${hexAlpha(palette.cellGrid, 0.4)}`,
    }}
  >
    <span className="font-bold text-[16px] tabular-nums" style={{ color: palette.onSurface }}>
      {value}
    </span>
    <span className="text-[11px]" style={{ color: palette.onSurfaceMuted }}>
      {label}
    </span>
  </div>
);

export const SimulatedBadge: React.FC<{ palette: GamePalette }> = ({ palette }) => (
  <div
    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold"
    style={{
      backgroundColor: hexAlpha(palette.gold, 0.18),
      color: palette.gold,
    }}
  >
    حالت آزمایشی وب
  </div>
);

/**
 * Tactile 3D-beveled toy block / gem renderer for tray pieces and drag overlays.
 */
export const PieceSvg: React.FC<{
  shape: PieceShape;
  color: string;
  cellPx: number;
  alpha?: number;
}> = ({ shape, color, cellPx, alpha = 1 }) => {
  const width = shape.width * cellPx;
  const height = shape.height * cellPx;
  const gap = Math.max(2, cellPx * 0.1);
  const blockSize = Math.max(4, cellPx - gap);
  const radius = cellPx * 0.22;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block pointer-events-none select-none overflow-visible"
      style={{
        opacity: alpha,
        filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.30))',
      }}
    >
      {shape.cells.map((cell, idx) => {
        const x = cell.col * cellPx + gap / 2;
        const y = cell.row * cellPx + gap / 2;
        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={blockSize}
              height={blockSize}
              rx={radius}
              ry={radius}
              fill={color}
            />
            <rect
              x={x + 1}
              y={y + 1}
              width={Math.max(2, blockSize - 2)}
              height={Math.max(2, blockSize * 0.42)}
              rx={Math.max(1, radius * 0.75)}
              ry={Math.max(1, radius * 0.75)}
              fill="rgba(255,255,255,0.26)"
            />
            <rect
              x={x + blockSize * 0.16}
              y={y + blockSize * 0.14}
              width={Math.max(2, blockSize * 0.36)}
              height={Math.max(1.5, blockSize * 0.14)}
              rx={blockSize * 0.07}
              fill="rgba(255,255,255,0.50)"
            />
            <rect
              x={x + 1}
              y={y + blockSize * 0.78}
              width={Math.max(2, blockSize - 2)}
              height={Math.max(1.5, blockSize * 0.2)}
              rx={Math.max(1, radius * 0.5)}
              fill="rgba(0,0,0,0.20)"
            />
            <rect
              x={x + 0.5}
              y={y + 0.5}
              width={Math.max(2, blockSize - 1)}
              height={Math.max(2, blockSize - 1)}
              rx={radius}
              ry={radius}
              fill="none"
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};
