import React, { useEffect, useState } from 'react';
import {
  BOARD_SIZE,
  fullColumnIndices,
  fullRowIndices,
  indexOf,
  NEUTRAL_BLOCK_COLOR,
} from '../engine/models';
import { DragUi, PlacementFx } from '../state/useGameController';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits } from '../utils/fa';

interface BoardViewProps {
  board: number[];
  remainingTargets: number[];
  drag: DragUi | null;
  lastCleared: number[];
  fx: PlacementFx | null;
  combo?: number;
  reduceMotion: boolean;
  hammerMode: boolean;
  inputEnabled: boolean;
  palette: GamePalette;
  boardRef: React.RefObject<HTMLDivElement | null>;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  boardPx?: number;
  selectedSlotActive: boolean;
  onCellTap: (row: number, col: number) => void;
  onCellHover?: (row: number | null, col: number | null) => void;
}

interface BurstParticle {
  id: string;
  row: number;
  col: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  remainingTargets,
  drag,
  lastCleared,
  fx,
  combo = 0,
  reduceMotion,
  hammerMode,
  inputEnabled,
  palette,
  boardRef,
  gridRef,
  boardPx,
  selectedSlotActive,
  onCellTap,
  onCellHover,
}) => {
  const [hammerHover, setHammerHover] = useState<{ row: number; col: number } | null>(null);
  const [activeFx, setActiveFx] = useState<PlacementFx | null>(null);
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  useEffect(() => {
    if (!fx || reduceMotion) {
      setActiveFx(null);
      setParticles([]);
      return;
    }
    setActiveFx(fx);

    if (fx.clearedCells.length > 0) {
      const nextParticles: BurstParticle[] = [];
      const sourceCells = fx.clearedCells.slice(0, 24);
      sourceCells.forEach((cellIdx, cIdx) => {
        const row = Math.floor(cellIdx / BOARD_SIZE);
        const col = cellIdx % BOARD_SIZE;
        for (let k = 0; k < 3; k++) {
          const angle = ((cIdx * 3 + k) * 137.5 * Math.PI) / 180;
          const dist = 24 + ((cIdx + k) % 3) * 14;
          nextParticles.push({
            id: `${fx.id}-${cellIdx}-${k}`,
            row,
            col,
            tx: Math.cos(angle) * dist,
            ty: Math.sin(angle) * dist - 10,
            color:
              k === 0
                ? palette.gold
                : palette.pieceColors[(cellIdx + k) % palette.pieceColors.length],
            size: k === 0 ? 8 : 6,
          });
        }
      });
      setParticles(nextParticles);
    } else {
      setParticles([]);
    }

    const timer = window.setTimeout(() => {
      setActiveFx(null);
      setParticles([]);
    }, 1050);
    return () => window.clearTimeout(timer);
  }, [fx, reduceMotion, palette.gold, palette.pieceColors]);

  const lastClearedSet = new Set(lastCleared);
  const targetSet = new Set(remainingTargets);
  const placedPopSet = new Set(activeFx?.placedIndices ?? []);

  const ghostMap = new Map<number, boolean>();
  const predictedClearCells = new Set<number>();

  if (drag) {
    for (const sc of drag.shape.cells) {
      const r = drag.targetRow + sc.row;
      const c = drag.targetCol + sc.col;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        ghostMap.set(indexOf(r, c), drag.valid);
      }
    }

    if (drag.valid) {
      const simBoard = [...board];
      for (const sc of drag.shape.cells) {
        const r = drag.targetRow + sc.row;
        const c = drag.targetCol + sc.col;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          simBoard[indexOf(r, c)] = drag.color;
        }
      }
      for (const r of fullRowIndices(simBoard)) {
        for (let c = 0; c < BOARD_SIZE; c++) predictedClearCells.add(indexOf(r, c));
      }
      for (const c of fullColumnIndices(simBoard)) {
        for (let r = 0; r < BOARD_SIZE; r++) predictedClearCells.add(indexOf(r, c));
      }
    }
  }

  const hammerSet = new Set<number>();
  if (hammerMode && hammerHover) {
    for (let r = hammerHover.row - 1; r <= hammerHover.row + 1; r++) {
      for (let c = hammerHover.col - 1; c <= hammerHover.col + 1; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          hammerSet.add(indexOf(r, c));
        }
      }
    }
  }

  let calloutTitle = '';
  if (activeFx) {
    if (activeFx.lines >= 3) calloutTitle = `${faDigits(activeFx.lines)} خط فوق‌العاده!`;
    else if (activeFx.lines === 2) calloutTitle = '۲ خط هم‌زمان! عالی!';
    else if (activeFx.combo >= 2) calloutTitle = `کمبو ×${faDigits(activeFx.combo)}!`;
    else if (activeFx.lines === 1) calloutTitle = 'آفرین!';
  }

  const comboGlow = combo >= 2;

  return (
    <div
      ref={boardRef}
      dir="ltr"
      onMouseLeave={() => {
        setHammerHover(null);
        onCellHover?.(null, null);
      }}
      className="relative aspect-square rounded-[26px] p-2.5 select-none touch-none transition-shadow duration-300 shrink-0"
      style={{
        width: boardPx ? `${boardPx}px` : 'min(92vw, 46dvh, 410px)',
        height: boardPx ? `${boardPx}px` : 'min(92vw, 46dvh, 410px)',
        background: `linear-gradient(160deg, ${palette.surfaceElevated} 0%, ${palette.boardBackground} 100%)`,
        border: `2.5px solid ${
          hammerMode && inputEnabled
            ? palette.danger
            : comboGlow
              ? hexAlpha(palette.gold, 0.8)
              : hexAlpha(palette.accent, 0.34)
        }`,
        boxShadow: comboGlow
          ? `inset 0 2px 12px rgba(0,0,0,0.28), 0 0 28px ${hexAlpha(palette.gold, 0.28)}, 0 12px 28px rgba(0,0,0,0.26)`
          : `inset 0 2px 10px rgba(0,0,0,0.28), 0 12px 26px rgba(0,0,0,0.22)`,
      }}
    >
      {/* Warm inner recessed tray */}
      <div
        ref={gridRef}
        className="grid grid-cols-8 grid-rows-8 w-full h-full gap-[3.5px] rounded-[18px] p-1"
        style={{
          backgroundColor: palette.boardBackground,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.28)',
        }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
          const row = Math.floor(index / BOARD_SIZE);
          const col = index % BOARD_SIZE;
          const value = board[index] ?? 0;

          const isNeutral = value === NEUTRAL_BLOCK_COLOR;
          const isFilled = value > 0;
          const isLastCleared = lastClearedSet.has(index);
          const isTarget = targetSet.has(index);
          const ghostValid = ghostMap.get(index);
          const hasGhost = ghostValid !== undefined;
          const isPredictedClear = predictedClearCells.has(index);
          const inHammerArea = hammerSet.has(index);
          const shouldPop = placedPopSet.has(index);

          // Warm 4x4 sub-quadrant nuance for comfortable reading + cozy mosaic feel
          const quadAlt = (Math.floor(row / 4) + Math.floor(col / 4)) % 2 === 1;
          const checkerAlt = (row + col) % 2 === 1;
          let cellColor = quadAlt
            ? checkerAlt
              ? hexAlpha(palette.cellEmpty, 0.96)
              : hexAlpha(palette.cellEmpty, 0.88)
            : checkerAlt
              ? hexAlpha(palette.cellEmpty, 0.8)
              : palette.cellEmpty;

          if (isNeutral) {
            cellColor = palette.blockedCell;
          } else if (value > 0) {
            cellColor = palette.pieceColors[(value - 1) % palette.pieceColors.length];
          }

          return (
            <button
              key={index}
              type="button"
              disabled={!inputEnabled || (!hammerMode && !selectedSlotActive)}
              onClick={() => {
                if (!inputEnabled) return;
                if (hammerMode || selectedSlotActive) {
                  onCellTap(row, col);
                }
              }}
              onMouseEnter={() => {
                if (hammerMode) setHammerHover({ row, col });
                if (selectedSlotActive) onCellHover?.(row, col);
              }}
              aria-label={`سطر ${row + 1}، ستون ${col + 1}`}
              className={`relative rounded-[24%] overflow-hidden ${
                (hammerMode || selectedSlotActive) && inputEnabled ? 'cursor-pointer' : 'cursor-default'
              } ${shouldPop ? 'animate-block-pop' : ''}`}
              style={{
                backgroundColor: cellColor,
                boxShadow: isFilled
                  ? `inset 0 2px 0 rgba(255,255,255,0.30), inset 0 -3px 0 ${palette.pieceShadow}, 0 2px 4px rgba(0,0,0,0.18)`
                  : isTarget
                    ? `inset 0 0 10px ${hexAlpha(palette.gold, 0.25)}`
                    : `inset 0 1px 2px rgba(0,0,0,0.15)`,
                border: isPredictedClear
                  ? `2px solid ${palette.gold}`
                  : isFilled
                    ? '1px solid rgba(255,255,255,0.20)'
                    : isTarget
                      ? `1.5px solid ${hexAlpha(palette.gold, 0.72)}`
                      : `1px solid ${hexAlpha(palette.cellGrid, 0.24)}`,
              }}
            >
              {isFilled && !isNeutral && (
                <span
                  className="absolute top-[13%] left-[15%] w-[38%] h-[16%] rounded-full pointer-events-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.44)' }}
                />
              )}

              {/* Carved stone mosaic tile for pre-placed neutral blocks */}
              {isNeutral && (
                <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full pointer-events-none">
                  <rect
                    x="3.5"
                    y="3.5"
                    width="17"
                    height="17"
                    rx="4"
                    fill="none"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="12,6 18,12 12,18 6,12"
                    fill="rgba(255,255,255,0.12)"
                    stroke="rgba(0,0,0,0.18)"
                    strokeWidth="1"
                  />
                </svg>
              )}

              {isPredictedClear && !hasGhost && (
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: hexAlpha(palette.gold, 0.28),
                    boxShadow: `inset 0 0 8px ${palette.gold}`,
                  }}
                />
              )}

              {/* Warm glowing lantern star indicator */}
              {isTarget && (
                <span
                  className={`absolute inset-[10%] rounded-[22%] pointer-events-none flex items-center justify-center ${
                    reduceMotion ? '' : 'animate-target-pulse'
                  }`}
                  style={{
                    background: `radial-gradient(circle, ${hexAlpha(palette.gold, 0.34)} 0%, transparent 72%)`,
                  }}
                >
                  <span
                    className="text-[12px] sm:text-[14px] leading-none font-bold"
                    style={{
                      color: palette.gold,
                      textShadow: `0 0 8px ${hexAlpha(palette.gold, 0.75)}, 0 1px 2px rgba(0,0,0,0.55)`,
                    }}
                  >
                    ★
                  </span>
                </span>
              )}

              {isLastCleared && !reduceMotion && (
                <span
                  key={`flash-${fx?.id ?? 0}-${index}`}
                  className="absolute inset-0 pointer-events-none animate-line-flash"
                  style={{ backgroundColor: hexAlpha(palette.gold, 0.45) }}
                />
              )}

              {inHammerArea && (
                <span
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{
                    backgroundColor: hexAlpha(palette.danger, 0.35),
                    border: `1.5px solid ${palette.danger}`,
                  }}
                >
                  {value > 0 && <span className="text-[10px]">💥</span>}
                </span>
              )}

              {hasGhost && (
                <span
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{
                    backgroundColor: ghostValid ? palette.validGhost : palette.invalidGhost,
                    border: ghostValid ? `2px solid ${palette.accent}` : 'none',
                    boxShadow: ghostValid ? `inset 0 0 8px rgba(255,255,255,0.34)` : 'none',
                  }}
                >
                  {!ghostValid && (
                    <svg viewBox="0 0 24 24" className="w-[70%] h-[70%]">
                      <line
                        x1="4"
                        y1="4"
                        x2="20"
                        y2="20"
                        stroke={palette.danger}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="20"
                        y1="4"
                        x2="4"
                        y2="20"
                        stroke={palette.danger}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {particles.length > 0 && (
        <div className="absolute inset-2.5 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-sm animate-burst-particle"
              style={
                {
                  left: `${((p.col + 0.5) / BOARD_SIZE) * 100}%`,
                  top: `${((p.row + 0.5) / BOARD_SIZE) * 100}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  marginLeft: `-${p.size / 2}px`,
                  marginTop: `-${p.size / 2}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {activeFx && activeFx.gainedScore > 0 && (
        <div
          key={`callout-${activeFx.id}`}
          dir="rtl"
          className="absolute inset-x-0 top-[36%] flex flex-col items-center justify-center pointer-events-none z-20 animate-score-float"
        >
          {calloutTitle && (
            <span
              className="font-bold text-base sm:text-xl px-3 py-0.5 rounded-full shadow-lg mb-1"
              style={{
                backgroundColor: palette.gold,
                color: '#3B1E00',
              }}
            >
              {calloutTitle}
            </span>
          )}
          <span
            className="font-bold text-sm sm:text-lg px-2.5 py-0.5 rounded-full tabular-nums shadow"
            style={{
              backgroundColor: hexAlpha(palette.surfaceElevated, 0.92),
              color: palette.accent,
              border: `1px solid ${hexAlpha(palette.accent, 0.5)}`,
            }}
          >
            +{faDigits(activeFx.gainedScore)} امتیاز
          </span>
        </div>
      )}
    </div>
  );
};
