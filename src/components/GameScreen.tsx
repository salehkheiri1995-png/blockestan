import React, { useEffect, useRef, useState } from 'react';
import bannerImg from '../assets/images/blockestan_home_banner_1794865543793.jpg';
import mascotImg from '../assets/images/blockestan_hero_mascot_1794865543635.jpg';
import trophyImg from '../assets/images/blockestan_trophy_reward_1794865544012.jpg';
import { chapterForLevel } from '../data/story';
import { GameBalanceConfig } from '../engine/balance';
import { BOARD_SIZE, Cell, GameMode, GoalType, Piece, RunStatus } from '../engine/models';
import { DragUi, GameController, GameUiState, ResultUi } from '../state/useGameController';
import { GamePalette, hexAlpha } from '../theme/themes';
import { faDigits, groupedFa } from '../utils/fa';
import { BoardView } from './BoardView';
import {
  ArtImage,
  CurrencyPairBadge,
  PieceSvg,
  PrimaryButton,
  SecondaryButton,
  StarRow,
  StatPill,
} from './Components';

interface GameScreenProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
}

export const GameScreen: React.FC<GameScreenProps> = ({ ui, ctrl, palette }) => {
  const boardAreaRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [boardPx, setBoardPx] = useState<number>(320);
  const [boardCellPx, setBoardCellPx] = useState<number>(38);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const session = ui.session;

  const isPlaying = Boolean(
    session && !ui.inputLocked && !ui.result && session.status === RunStatus.PLAYING
  );

  useEffect(() => {
    const measure = () => {
      if (boardAreaRef.current) {
        const areaRect = boardAreaRef.current.getBoundingClientRect();
        const available = Math.min(areaRect.width - 4, areaRect.height - 4, 412);
        if (available > 120) {
          setBoardPx(Math.floor(available));
        }
      }
      if (gridRef.current) {
        const gRect = gridRef.current.getBoundingClientRect();
        if (gRect.width > 40) {
          setBoardCellPx(gRect.width / BOARD_SIZE);
        }
      } else if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const innerWidth = Math.max(80, rect.width - 28);
        setBoardCellPx(innerWidth / BOARD_SIZE);
      }
    };

    measure();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null;
    if (ro && boardAreaRef.current) ro.observe(boardAreaRef.current);
    if (ro && gridRef.current) ro.observe(gridRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ui.screen, ui.level?.id, ui.hammerMode]);

  if (!session) return null;

  const currentChapter = ui.level ? chapterForLevel(ui.level.id) : null;
  const headerBackdrop = currentChapter ? currentChapter.image : bannerImg;
  const movesLeft = ui.level ? Math.max(0, ui.level.moveLimit - session.movesUsed) : null;

  const buildDrag = (
    slot: number,
    piece: Piece,
    pointerX: number,
    pointerY: number,
    grabCell: Cell,
    liftOffsetPx: number
  ): DragUi => {
    const gridRect = gridRef.current?.getBoundingClientRect();
    const fallbackRect = boardRef.current?.getBoundingClientRect();
    const cell = gridRect
      ? Math.max(16, gridRect.width / BOARD_SIZE)
      : fallbackRect
        ? Math.max(16, (fallbackRect.width - 28) / BOARD_SIZE)
        : boardCellPx;
    const innerLeft = gridRect ? gridRect.left : fallbackRect ? fallbackRect.left + 14 : 0;
    const innerTop = gridRect ? gridRect.top : fallbackRect ? fallbackRect.top + 14 : 0;

    const visualPointerY = pointerY - liftOffsetPx;
    const topLeftX = pointerX - grabCell.col * cell - cell * 0.5;
    const topLeftY = visualPointerY - grabCell.row * cell - cell * 0.5;
    const targetCol = Math.round((topLeftX - innerLeft) / cell);
    const targetRow = Math.round((topLeftY - innerTop) / cell);
    const valid = ctrl.canPlace(slot, targetRow, targetCol);
    return {
      slot,
      shape: piece.shape,
      color: piece.color,
      pointerX,
      pointerY: visualPointerY,
      grabCell,
      targetRow,
      targetCol,
      valid,
    };
  };

  const resolveAnchorForCell = (
    slot: number,
    row: number,
    col: number
  ): { row: number; col: number; valid: boolean } => {
    if (ctrl.canPlace(slot, row, col)) {
      return { row, col, valid: true };
    }
    const piece = session.tray[slot];
    if (piece) {
      for (const sc of piece.shape.cells) {
        const candRow = row - sc.row;
        const candCol = col - sc.col;
        if (ctrl.canPlace(slot, candRow, candCol)) {
          return { row: candRow, col: candCol, valid: true };
        }
      }
    }
    return { row, col, valid: false };
  };

  let effectiveDrag = ui.drag;
  if (!effectiveDrag && ui.selectedSlot !== null && hoverCell && isPlaying && !ui.hammerMode) {
    const piece = session.tray[ui.selectedSlot];
    if (piece) {
      const resolved = resolveAnchorForCell(ui.selectedSlot, hoverCell.row, hoverCell.col);
      effectiveDrag = {
        slot: ui.selectedSlot,
        shape: piece.shape,
        color: piece.color,
        pointerX: 0,
        pointerY: 0,
        grabCell: { row: 0, col: 0 },
        targetRow: resolved.row,
        targetCol: resolved.col,
        valid: resolved.valid,
      };
    }
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 select-none">
      {/* Feel-good full-screen scenic backdrop behind the board & console */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={headerBackdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105 opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 48%, ${hexAlpha(palette.backgroundTop, 0.56)} 0%, ${hexAlpha(palette.backgroundBottom, 0.88)} 82%)`,
          }}
        />
      </div>

      {/* Unified Mobile Portrait Console Column — Symmetrical Top HUD, Center Pedestal, Bottom Console */}
      <div className="relative z-10 w-full max-w-[432px] h-full flex flex-col justify-between gap-1.5 sm:gap-2">
        {/* TOP HUD CARD: Warm Chapter Atmosphere + Symmetrical Goal Chips */}
        <div
          className="relative w-full rounded-[22px] overflow-hidden shrink-0 shadow-md"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.accent, 0.32)}`,
          }}
        >
          {/* Subtle warm scenic backdrop */}
          <img
            src={headerBackdrop}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${hexAlpha(palette.surface, 0.72)} 0%, ${hexAlpha(palette.surfaceElevated, 0.94)} 100%)`,
            }}
          />

          <div className="relative z-10 px-2.5 py-2 flex flex-col gap-1.5">
            {/* Row 1: Navigation + Title + Currencies */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={ctrl.goHome}
                  aria-label="بازگشت به خانه"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] leading-none cursor-pointer hover:opacity-85 shrink-0"
                  style={{
                    color: palette.onSurface,
                    backgroundColor: hexAlpha(palette.backgroundBottom, 0.42),
                    border: `1px solid ${hexAlpha(palette.cellGrid, 0.35)}`,
                  }}
                >
                  →
                </button>
                <div
                  className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm cursor-pointer"
                  onClick={() => currentChapter && ctrl.openStoryChapter(currentChapter.id)}
                  style={{ border: `1.5px solid ${hexAlpha(palette.accent, 0.6)}` }}
                  title={currentChapter ? 'داستان فصل' : 'بلوکستان'}
                >
                  <ArtImage
                    src={mascotImg}
                    alt="فیروز"
                    className="w-full h-full object-cover"
                    fallbackIcon="🧩"
                    palette={palette}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[13px] sm:text-[14px] truncate" style={{ color: palette.onSurface }}>
                      {ui.mode === GameMode.LEVEL
                        ? `مرحلهٔ ${faDigits(ui.level?.id ?? 0)} · ${ui.level?.title}`
                        : ui.mode === GameMode.DAILY
                          ? 'چالش روزانه'
                          : 'حالت بی‌پایان'}
                    </span>
                    {session.combo > 1 && (
                      <span
                        className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: hexAlpha(palette.gold, 0.24),
                          color: palette.gold,
                        }}
                      >
                        ×{faDigits(session.combo)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] tabular-nums truncate" style={{ color: palette.onSurfaceMuted }}>
                    {currentChapter ? currentChapter.shortTitle : `امتیاز: ${groupedFa(session.score)}`}
                    {ui.mode === GameMode.CLASSIC && ui.save.classicBest > 0
                      ? ` · رکورد ${groupedFa(Math.max(ui.save.classicBest, session.score))}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => ctrl.setSoundEnabled(!ui.save.soundEnabled)}
                  aria-label={ui.save.soundEnabled ? 'قطع صدا' : 'روشن‌کردن صدا'}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer shrink-0"
                  style={{
                    backgroundColor: hexAlpha(palette.backgroundBottom, 0.35),
                    border: `1px solid ${hexAlpha(palette.cellGrid, 0.4)}`,
                    color: palette.onSurface,
                  }}
                >
                  {ui.save.soundEnabled ? '🔊' : '🔇'}
                </button>
                <CurrencyPairBadge coins={ui.save.coins} gems={ui.save.gems} palette={palette} compact />
              </div>
            </div>

            {/* Row 2: Symmetrical Compact Goals Strip (Level Mode) or Score Gauge (Classic/Daily) */}
            {ui.level ? (
              <div className="flex items-stretch gap-1.5">
                {/* 3 Equal Goal Chips */}
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  {ui.level.goals.map((goal) => {
                    let icon = '🎯';
                    let label = 'امتیاز';
                    let current = session.score;
                    if (goal.type === GoalType.LINES) {
                      icon = '✨';
                      label = 'خط';
                      current = session.linesCleared;
                    } else if (goal.type === GoalType.TARGET_CELLS) {
                      icon = '★';
                      label = 'ستاره';
                      current = ui.level!.targetCells.length - session.remainingTargets.length;
                    }
                    const done = current >= goal.target;
                    const pct = Math.min(100, Math.max(0, (current / goal.target) * 100));

                    return (
                      <div
                        key={goal.type}
                        className="rounded-xl px-2 py-1 flex flex-col justify-between gap-0.5"
                        style={{
                          backgroundColor: hexAlpha(
                            done ? palette.success : palette.backgroundBottom,
                            done ? 0.18 : 0.34
                          ),
                          border: `1px solid ${hexAlpha(
                            done ? palette.success : palette.cellGrid,
                            done ? 0.55 : 0.35
                          )}`,
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span style={{ color: done ? palette.success : palette.onSurfaceMuted }}>
                            {icon} {label}
                          </span>
                          <span
                            className="font-bold tabular-nums"
                            style={{ color: done ? palette.success : palette.onSurface }}
                          >
                            {faDigits(Math.min(current, goal.target))}/{faDigits(goal.target)}
                          </span>
                        </div>
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: hexAlpha(palette.cellGrid, 0.45) }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-150"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: done ? palette.success : palette.accent,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Prominent Symmetrical Moves Counter Pill */}
                <div
                  className="w-[62px] rounded-xl px-1.5 py-1 flex flex-col items-center justify-center shrink-0"
                  style={{
                    backgroundColor: hexAlpha(
                      movesLeft !== null && movesLeft <= 2 ? palette.danger : palette.accent,
                      0.18
                    ),
                    border: `1px solid ${hexAlpha(
                      movesLeft !== null && movesLeft <= 2 ? palette.danger : palette.accent,
                      0.5
                    )}`,
                  }}
                >
                  <span
                    className="font-bold text-[15px] leading-none tabular-nums"
                    style={{
                      color: movesLeft !== null && movesLeft <= 2 ? palette.danger : palette.accent,
                    }}
                  >
                    {faDigits(movesLeft ?? 0)}
                  </span>
                  <span className="text-[9px] mt-0.5" style={{ color: palette.onSurfaceMuted }}>
                    حرکت
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <div
                  className="rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px]"
                  style={{ backgroundColor: hexAlpha(palette.backgroundBottom, 0.32) }}
                >
                  <span style={{ color: palette.onSurfaceMuted }}>امتیاز</span>
                  <span className="font-bold tabular-nums" style={{ color: palette.onSurface }}>
                    {groupedFa(session.score)}
                  </span>
                </div>
                <div
                  className="rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px]"
                  style={{ backgroundColor: hexAlpha(palette.backgroundBottom, 0.32) }}
                >
                  <span style={{ color: palette.onSurfaceMuted }}>خط‌ها</span>
                  <span className="font-bold tabular-nums" style={{ color: palette.accent }}>
                    {faDigits(session.linesCleared)}
                  </span>
                </div>
                <div
                  className="rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px]"
                  style={{ backgroundColor: hexAlpha(palette.backgroundBottom, 0.32) }}
                >
                  <span style={{ color: palette.onSurfaceMuted }}>حرکت</span>
                  <span className="font-bold tabular-nums" style={{ color: palette.gold }}>
                    {faDigits(session.movesUsed)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER STAGE: Balanced Sculpted 8x8 Board Pedestal */}
        <div
          ref={boardAreaRef}
          className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden"
        >
          <BoardView
            board={session.board}
            remainingTargets={session.remainingTargets}
            drag={effectiveDrag}
            lastCleared={ui.lastCleared}
            fx={ui.fx}
            combo={session.combo}
            reduceMotion={ui.save.reduceMotion}
            hammerMode={ui.hammerMode}
            inputEnabled={isPlaying}
            palette={palette}
            boardRef={boardRef}
            gridRef={gridRef}
            boardPx={boardPx}
            selectedSlotActive={ui.selectedSlot !== null}
            onCellTap={(row, col) => {
              if (ui.hammerMode) {
                ctrl.hammerAt(row, col);
              } else if (ui.selectedSlot !== null) {
                const resolved = resolveAnchorForCell(ui.selectedSlot, row, col);
                ctrl.placePiece(ui.selectedSlot, resolved.row, resolved.col);
              }
            }}
            onCellHover={(row, col) => {
              if (row === null || col === null) setHoverCell(null);
              else setHoverCell({ row, col });
            }}
          />
        </div>

        {/* BOTTOM CONSOLE: Unified Warm Tray + Power-ups Dock */}
        <div
          className="w-full rounded-[24px] p-2 sm:p-2.5 flex flex-col gap-2 shrink-0 shadow-lg"
          style={{
            backgroundColor: palette.surface,
            border: `1px solid ${hexAlpha(palette.accent, 0.28)}`,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.16)',
          }}
        >
          {ui.hammerMode ? (
            <div
              className="w-full rounded-xl px-3 py-1.5 flex items-center justify-between gap-2"
              style={{
                backgroundColor: hexAlpha(palette.danger, 0.2),
                border: `1px solid ${hexAlpha(palette.danger, 0.5)}`,
              }}
            >
              <span className="text-[11px] font-medium" style={{ color: palette.onSurface }}>
                حالت چکش فعال است: روی یک خانه بزن تا محدودهٔ ۳×۳ پاک شود.
              </span>
              <button
                type="button"
                onClick={ctrl.toggleHammer}
                className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0"
                style={{ backgroundColor: palette.danger, color: '#FFFFFF' }}
              >
                لغو
              </button>
            </div>
          ) : ui.selectedSlot !== null && isPlaying ? (
            <p className="text-[11px] text-center font-medium" style={{ color: palette.accent }}>
              حالا روی خانهٔ دلخواه تخته بزن تا قطعه چیده شود
            </p>
          ) : null}

          {/* 3 Recessed Piece Pedestals */}
          <TrayRow
            ui={ui}
            ctrl={ctrl}
            palette={palette}
            enabled={isPlaying && !ui.hammerMode}
            buildDrag={buildDrag}
          />

          {/* 3 Balanced Power-Up Boosters + Chapter Story Button */}
          <div className="w-full grid grid-cols-4 gap-1.5">
            <BoosterButton
              icon="↩"
              title="بازگشت"
              cost={GameBalanceConfig.UNDO_COST}
              enabled={isPlaying}
              palette={palette}
              onClick={ctrl.requestUndo}
            />
            <BoosterButton
              icon="🔀"
              title="تعویض"
              cost={GameBalanceConfig.SWAP_COST}
              enabled={isPlaying}
              palette={palette}
              onClick={ctrl.requestSwap}
            />
            <BoosterButton
              icon="🔨"
              title={ui.hammerMode ? 'لغو چکش' : 'چکش'}
              cost={GameBalanceConfig.HAMMER_COST}
              enabled={isPlaying}
              highlight={ui.hammerMode}
              palette={palette}
              onClick={ctrl.toggleHammer}
            />
            <button
              type="button"
              onClick={() =>
                currentChapter ? ctrl.openStoryChapter(currentChapter.id) : ctrl.openShop()
              }
              className="min-h-[46px] rounded-2xl px-1 py-1 flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95"
              style={{
                backgroundColor: hexAlpha(palette.accent, 0.14),
                border: `1px solid ${hexAlpha(palette.accent, 0.35)}`,
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: palette.accent }}>
                {currentChapter ? '📖 داستان' : '🎨 پوسته'}
              </span>
              <span className="text-[9px]" style={{ color: palette.onSurfaceMuted }}>
                {currentChapter ? currentChapter.shortTitle : 'فروشگاه'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Dragged Piece Overlay */}
      {ui.drag && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${ui.drag.pointerX - ui.drag.grabCell.col * boardCellPx - boardCellPx * 0.5}px`,
            top: `${ui.drag.pointerY - ui.drag.grabCell.row * boardCellPx - boardCellPx * 0.5}px`,
          }}
        >
          <PieceSvg
            shape={ui.drag.shape}
            color={palette.pieceColors[(ui.drag.color - 1) % palette.pieceColors.length]}
            cellPx={boardCellPx}
            alpha={0.94}
          />
        </div>
      )}

      {/* Result Modal */}
      {ui.result && (
        <ResultDialog ui={ui} result={ui.result} ctrl={ctrl} palette={palette} />
      )}
    </div>
  );
};

interface TrayRowProps {
  ui: GameUiState;
  ctrl: GameController;
  palette: GamePalette;
  enabled: boolean;
  buildDrag: (
    slot: number,
    piece: Piece,
    px: number,
    py: number,
    grab: Cell,
    liftOffsetPx: number
  ) => DragUi;
}

const TrayRow: React.FC<TrayRowProps> = ({ ui, ctrl, palette, enabled, buildDrag }) => {
  const tray = ui.session?.tray ?? [null, null, null];
  const trayCellPx = 20;

  return (
    <div className="w-full grid grid-cols-3 gap-2">
      {[0, 1, 2].map((slot) => {
        const piece = tray[slot];
        const isDraggingThis = ui.drag?.slot === slot;
        const isSelected = ui.selectedSlot === slot;

        return (
          <TraySlot
            key={slot}
            piece={piece}
            slot={slot}
            cellPx={trayCellPx}
            enabled={enabled}
            isSelected={isSelected}
            isDragging={isDraggingThis}
            palette={palette}
            ctrl={ctrl}
            buildDrag={buildDrag}
          />
        );
      })}
    </div>
  );
};

interface TraySlotProps {
  piece: Piece | null;
  slot: number;
  cellPx: number;
  enabled: boolean;
  isSelected: boolean;
  isDragging: boolean;
  palette: GamePalette;
  ctrl: GameController;
  buildDrag: (
    slot: number,
    piece: Piece,
    px: number,
    py: number,
    grab: Cell,
    liftOffsetPx: number
  ) => DragUi;
}

const TraySlot: React.FC<TraySlotProps> = ({
  piece,
  slot,
  cellPx,
  enabled,
  isSelected,
  isDragging,
  palette,
  ctrl,
  buildDrag,
}) => {
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !piece) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }

    const rect = svgWrapRef.current?.getBoundingClientRect();
    const localX = rect ? e.clientX - rect.left : (piece.shape.width * cellPx) / 2;
    const localY = rect ? e.clientY - rect.top : (piece.shape.height * cellPx) / 2;
    const grabCol = Math.min(piece.shape.width - 1, Math.max(0, Math.floor(localX / cellPx)));
    const grabRow = Math.min(piece.shape.height - 1, Math.max(0, Math.floor(localY / cellPx)));
    const grab: Cell = { row: grabRow, col: grabCol };
    const liftOffsetPx = e.pointerType === 'touch' ? 54 : 0;

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 5) {
        moved = true;
      }
      if (moved) {
        ctrl.updateDrag(
          buildDrag(slot, piece, moveEvent.clientX, moveEvent.clientY, grab, liftOffsetPx)
        );
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };

    const onUp = () => {
      cleanup();
      if (moved) {
        ctrl.dropDrag();
      } else {
        ctrl.selectSlot(slot);
      }
    };

    const onCancel = () => {
      cleanup();
      ctrl.updateDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  const color = piece
    ? palette.pieceColors[(piece.color - 1) % palette.pieceColors.length]
    : palette.accent;

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`h-[74px] sm:h-[80px] flex items-center justify-center rounded-2xl transition-all touch-none select-none ${
        piece && enabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        backgroundColor: isSelected
          ? hexAlpha(palette.accent, 0.16)
          : hexAlpha(palette.boardBackground, 0.65),
        border: isSelected
          ? `2px solid ${palette.accent}`
          : `1px solid ${hexAlpha(palette.cellGrid, 0.3)}`,
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      {!piece ? (
        <div
          className="w-8 h-8 rounded-xl opacity-35 pointer-events-none"
          style={{ border: `1.5px dashed ${palette.cellGrid}` }}
        />
      ) : (
        <div
          ref={svgWrapRef}
          className="pointer-events-none transition-transform"
          style={{ opacity: isDragging ? 0.25 : 1 }}
        >
          <PieceSvg shape={piece.shape} color={color} cellPx={cellPx} />
        </div>
      )}
    </div>
  );
};

const BoosterButton: React.FC<{
  icon: string;
  title: string;
  cost: number;
  enabled: boolean;
  highlight?: boolean;
  palette: GamePalette;
  onClick: () => void;
}> = ({ icon, title, cost, enabled, highlight = false, palette, onClick }) => (
  <button
    type="button"
    disabled={!enabled}
    onClick={onClick}
    className="min-h-[46px] rounded-2xl px-1 py-1 flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
    style={{
      backgroundColor: highlight ? hexAlpha(palette.accent, 0.25) : palette.surfaceElevated,
      border: `1px solid ${highlight ? palette.accent : hexAlpha(palette.cellGrid, 0.45)}`,
      boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18)',
    }}
  >
    <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: palette.onSurface }}>
      <span aria-hidden="true">{icon}</span>
      <span>{title}</span>
    </span>
    <span className="text-[10px] tabular-nums" style={{ color: palette.gold }}>
      {faDigits(cost)} سکه
    </span>
  </button>
);

const ResultDialog: React.FC<{
  ui: GameUiState;
  result: ResultUi;
  ctrl: GameController;
  palette: GamePalette;
}> = ({ ui, result, ctrl, palette }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4">
    <div
      className="w-full max-w-sm rounded-3xl p-5 flex flex-col items-center gap-3 shadow-2xl"
      style={{
        backgroundColor: palette.surfaceElevated,
        border: `1px solid ${hexAlpha(palette.cellGrid, 0.5)}`,
      }}
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
        <ArtImage
          src={result.won ? trophyImg : mascotImg}
          alt={result.won ? 'جایزه پیروزی' : 'بلوکستان'}
          className="w-full h-full object-cover"
          fallbackIcon={result.won ? '🏆' : '🧩'}
          palette={palette}
        />
      </div>

      <h2 className="font-bold text-[20px] sm:text-[22px]" style={{ color: palette.onSurface }}>
        {result.won ? 'آفرین! برنده شدی!' : result.canContinue ? 'جای ادامه دارد!' : 'بازی تمام شد'}
      </h2>

      {result.won && result.levelId !== null && (
        <StarRow stars={result.stars} palette={palette} size={30} />
      )}

      {result.chapterCompletedTitle && (
        <div
          className="w-full rounded-xl px-3 py-2 text-center text-xs font-bold"
          style={{
            backgroundColor: hexAlpha(palette.gold, 0.18),
            color: palette.gold,
            border: `1px solid ${hexAlpha(palette.gold, 0.45)}`,
          }}
        >
          🎉 {result.chapterCompletedTitle} تکمیل شد!
        </div>
      )}

      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <StatPill label="امتیاز" value={groupedFa(result.score)} palette={palette} />
        <StatPill label="خط" value={faDigits(result.lines)} palette={palette} />
        {result.coinsEarned > 0 && (
          <StatPill label="سکه" value={`+${faDigits(result.coinsEarned)}`} palette={palette} />
        )}
        {result.gemsEarned > 0 && (
          <StatPill label="الماس" value={`+${faDigits(result.gemsEarned)}`} palette={palette} />
        )}
      </div>

      {result.newPersonalBest && (
        <p className="text-[13px] font-bold" style={{ color: palette.gold }}>
          رکورد شخصی جدید!
        </p>
      )}
      {result.dailyReward && (
        <p className="text-xs font-medium" style={{ color: palette.success }}>
          جایزهٔ چالش روزانه دریافت شد.
        </p>
      )}

      <div className="w-full flex flex-col gap-2 pt-1">
        {result.canContinue ? (
          <>
            <PrimaryButton
              text={`ادامه با ${faDigits(GameBalanceConfig.CONTINUE_GEM_COST)} الماس ♦`}
              onClick={ctrl.continueWithGems}
              palette={palette}
              className="w-full"
            />
            <SecondaryButton
              text={`ادامه با ${faDigits(GameBalanceConfig.CONTINUE_COST)} سکه`}
              onClick={ctrl.continueWithCoins}
              palette={palette}
              className="w-full"
            />
            {ui.rewardedConfigured && (
              <SecondaryButton
                text={ui.rewardedSimulated ? 'ادامه با تبلیغ شبیه‌سازی‌شده' : 'ادامه با تماشای تبلیغ'}
                onClick={ctrl.continueWithAd}
                palette={palette}
                className="w-full"
              />
            )}
            <SecondaryButton
              text="پذیرش نتیجه و پایان"
              onClick={ctrl.declineContinue}
              palette={palette}
              className="w-full"
            />
          </>
        ) : (
          <>
            {result.won && result.nextLevelAvailable && (
              <PrimaryButton
                text="مرحلهٔ بعد"
                onClick={ctrl.nextLevel}
                palette={palette}
                className="w-full"
              />
            )}
            {result.won && result.nextLevelAvailable ? (
              <SecondaryButton
                text="تکرار این مرحله"
                onClick={ctrl.playAgain}
                palette={palette}
                className="w-full"
              />
            ) : (
              <PrimaryButton
                text="بازی دوباره"
                onClick={ctrl.playAgain}
                palette={palette}
                className="w-full"
              />
            )}
            <SecondaryButton
              text="صفحهٔ اصلی"
              onClick={ctrl.homeFromResult}
              palette={palette}
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  </div>
);
