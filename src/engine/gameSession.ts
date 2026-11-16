import { GameBalanceConfig } from './balance';
import { LevelDefinition } from './levelModels';
import {
  BOARD_SIZE,
  BoosterOutcome,
  canPieceFit,
  cellsInFullLines,
  Difficulty,
  emptyBoard,
  fullColumnIndices,
  fullRowIndices,
  GameMode,
  GameState,
  GoalType,
  hasMove,
  inBounds,
  indexOf,
  Piece,
  PlacementError,
  PlacementOutcome,
  RescuePlan,
  RunStatus,
  toUndoSnapshot,
  undoSnapshotToState,
} from './models';
import { PieceGenerator, shapeFamilyOf } from './pieceGenerator';
import { DeterministicRandom } from './random';

export class GameSession {
  public readonly mode: GameMode;
  public readonly level: LevelDefinition | null;
  private current: GameState;
  private readonly generator: PieceGenerator;

  private constructor(
    mode: GameMode,
    level: LevelDefinition | null,
    initial: GameState,
    generator = new PieceGenerator()
  ) {
    if (mode === GameMode.LEVEL && !level) {
      throw new Error('Level mode requires a level definition');
    }
    if (mode !== GameMode.LEVEL && level) {
      throw new Error('Only level mode accepts a level definition');
    }
    this.mode = mode;
    this.level = level;
    this.current = initial;
    this.generator = generator;
  }

  get state(): GameState {
    return this.current;
  }

  canPlace(slot: number, row: number, col: number): boolean {
    if (this.current.status !== RunStatus.PLAYING) return false;
    const piece = this.current.tray[slot];
    if (!piece) return false;
    if (!inBounds(row, col)) return false;
    return piece.shape.cells.every((cell) => {
      const r = row + cell.row;
      const c = col + cell.col;
      return inBounds(r, c) && this.current.board[indexOf(r, c)] === 0;
    });
  }

  place(slot: number, row: number, col: number): PlacementOutcome {
    const before = this.current;
    if (before.status !== RunStatus.PLAYING) {
      return { ok: false, reason: PlacementError.NOT_PLAYING };
    }
    const piece = before.tray[slot];
    if (!piece) {
      return { ok: false, reason: PlacementError.EMPTY_SLOT };
    }
    if (piece.shape.cells.some((c) => !inBounds(row + c.row, col + c.col))) {
      return { ok: false, reason: PlacementError.OUT_OF_BOUNDS };
    }
    if (piece.shape.cells.some((c) => before.board[indexOf(row + c.row, col + c.col)] !== 0)) {
      return { ok: false, reason: PlacementError.OVERLAP };
    }

    const snapshot = toUndoSnapshot(before);
    const board = [...before.board];
    for (const cell of piece.shape.cells) {
      board[indexOf(row + cell.row, col + cell.col)] = piece.color;
    }

    const clearedRows = fullRowIndices(board);
    const clearedColumns = fullColumnIndices(board);
    const cleared = cellsInFullLines(board);
    const lines = clearedRows.length + clearedColumns.length;

    const newCombo = lines > 0 ? Math.min(before.combo + 1, GameBalanceConfig.MAX_COMBO) : 0;
    const multiplier =
      lines > 0
        ? Math.min(
            GameBalanceConfig.MAX_COMBO_MULTIPLIER,
            1.0 + (newCombo - 1) * GameBalanceConfig.COMBO_MULTIPLIER_STEP
          )
        : 1.0;

    const linePoints =
      lines * GameBalanceConfig.POINTS_PER_LINE +
      Math.max(0, lines - 1) * GameBalanceConfig.MULTI_LINE_BONUS_PER_EXTRA_LINE;
    const gain =
      piece.shape.size * GameBalanceConfig.POINTS_PER_PLACED_CELL +
      Math.round(linePoints * multiplier);

    for (const idx of cleared) {
      board[idx] = 0;
    }

    const clearedSet = new Set(cleared);
    const remainingTargets = before.remainingTargets.filter((idx) => !clearedSet.has(idx));
    let tray = [...before.tray];
    tray[slot] = null;
    let trayIndex = before.trayIndex;
    const rng = new DeterministicRandom(before.rngState);
    const movesUsed = before.movesUsed + 1;

    const goalsMet =
      this.level !== null &&
      this.level.goals.every((goal) => {
        switch (goal.type) {
          case GoalType.SCORE:
            return before.score + gain >= goal.target;
          case GoalType.LINES:
            return before.linesCleared + lines >= goal.target;
          case GoalType.TARGET_CELLS:
            return this.level!.targetCells.length - remainingTargets.length >= goal.target;
        }
      });

    let status: RunStatus = goalsMet
      ? RunStatus.WON
      : this.level !== null && movesUsed >= this.level.moveLimit
        ? RunStatus.LOST
        : RunStatus.PLAYING;

    if (status === RunStatus.PLAYING && tray.every((p) => p === null)) {
      const drawn = this.drawTray(trayIndex, rng);
      tray = drawn.tray;
      trayIndex = drawn.nextIndex;
    }

    if (status === RunStatus.PLAYING) {
      const candidate: GameState = {
        ...before,
        board,
        remainingTargets,
        tray,
        trayIndex,
        score: before.score + gain,
        combo: newCombo,
        linesCleared: before.linesCleared + lines,
        movesUsed,
        status: RunStatus.PLAYING,
        rngState: rng.state.toString(),
      };
      if (!hasMove(candidate)) {
        status = RunStatus.LOST;
      }
    }

    this.current = {
      ...before,
      board,
      remainingTargets,
      tray,
      trayIndex,
      score: before.score + gain,
      combo: newCombo,
      linesCleared: before.linesCleared + lines,
      movesUsed,
      status,
      rngState: rng.state.toString(),
      undo: status === RunStatus.PLAYING ? snapshot : null,
      lastCleared: cleared,
      lastLines: lines,
      lastGain: gain,
    };

    return {
      ok: true,
      gainedScore: gain,
      placedCells: piece.shape.size,
      clearedCells: cleared,
      clearedRows,
      clearedColumns,
      lines,
      combo: newCombo,
      status,
    };
  }

  undo(): BoosterOutcome {
    const before = this.current;
    if (before.status !== RunStatus.PLAYING) return { type: 'NotApplicable' };
    if (!before.undo) return { type: 'NotApplicable' };
    this.current = undoSnapshotToState(before.undo, before.seed);
    return { type: 'Applied', clearedCells: [] };
  }

  swapUnusedPieces(): BoosterOutcome {
    const before = this.current;
    if (before.status !== RunStatus.PLAYING) return { type: 'NotApplicable' };
    const activeSlots = [0, 1, 2].filter((idx) => before.tray[idx] !== null);
    if (activeSlots.length === 0) return { type: 'NotApplicable' };

    const difficulty = this.level?.difficulty ?? Difficulty.NORMAL;
    const oldSignatures = activeSlots.map((idx) => before.tray[idx]!.shape.name).join(',');
    const rng = new DeterministicRandom(before.rngState);

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = [...before.tray];
      const usedShapes = new Set<string>();
      const usedFamilies = new Set<ReturnType<typeof shapeFamilyOf>>();
      const usedColors = new Set<number>();
      for (const slot of activeSlots) {
        const piece = this.generator.pickDiversePiece(
          rng,
          difficulty,
          usedShapes,
          usedFamilies,
          usedColors
        );
        usedShapes.add(piece.shape.name);
        usedFamilies.add(shapeFamilyOf(piece.shape.name));
        usedColors.add(piece.color);
        candidate[slot] = piece;
      }
      const newSignatures = activeSlots.map((idx) => candidate[idx]!.shape.name).join(',');
      if (newSignatures !== oldSignatures) {
        this.current = {
          ...before,
          tray: candidate,
          rngState: rng.state.toString(),
          undo: null,
          lastCleared: [],
          lastLines: 0,
          lastGain: 0,
        };
        return { type: 'Applied', clearedCells: [] };
      }
    }
    return { type: 'NotApplicable' };
  }

  hammerRegion(centerRow: number, centerCol: number): number[] {
    if (!inBounds(centerRow, centerCol)) return [];
    const list: number[] = [];
    for (let row = centerRow - 1; row <= centerRow + 1; row++) {
      for (let col = centerCol - 1; col <= centerCol + 1; col++) {
        if (inBounds(row, col)) list.push(indexOf(row, col));
      }
    }
    return list;
  }

  useHammer(centerRow: number, centerCol: number): BoosterOutcome {
    const before = this.current;
    if (before.status !== RunStatus.PLAYING) return { type: 'NotApplicable' };
    const region = this.hammerRegion(centerRow, centerCol);
    const occupied = region.filter((idx) => before.board[idx] !== 0);
    if (occupied.length === 0) return { type: 'NotApplicable' };

    const board = [...before.board];
    for (const idx of occupied) {
      board[idx] = 0;
    }
    this.current = {
      ...before,
      board,
      undo: null,
      lastCleared: occupied,
      lastLines: 0,
      lastGain: 0,
    };
    return { type: 'Applied', clearedCells: occupied };
  }

  rescuePlan(): RescuePlan | null {
    const before = this.current;
    if (before.status !== RunStatus.LOST || before.continueUsed) return null;
    const pieces = before.tray.filter((p): p is Piece => p !== null);
    if (pieces.length === 0) return null;

    let best: RescuePlan | null = null;
    let bestScore = Number.MAX_SAFE_INTEGER;
    for (let centerRow = 0; centerRow < BOARD_SIZE; centerRow++) {
      for (let centerCol = 0; centerCol < BOARD_SIZE; centerCol++) {
        const region = this.hammerRegion(centerRow, centerCol);
        const occupied = region.filter((idx) => before.board[idx] !== 0);
        if (occupied.length === 0) continue;
        const board = [...before.board];
        for (const idx of occupied) board[idx] = 0;
        if (!pieces.some((p) => canPieceFit(board, p.shape))) continue;
        const distance = Math.abs(centerRow - 3) + Math.abs(centerCol - 3);
        const score = occupied.length * 100 + distance;
        if (score < bestScore) {
          bestScore = score;
          best = { centerRow, centerCol, clearedCells: occupied };
        }
      }
    }
    return best;
  }

  applyRescue(plan: RescuePlan): boolean {
    const before = this.current;
    if (before.status !== RunStatus.LOST || before.continueUsed) return false;
    const region = this.hammerRegion(plan.centerRow, plan.centerCol);
    const occupied = region.filter((idx) => before.board[idx] !== 0);
    if (occupied.length === 0) return false;
    const occSet = new Set(occupied);
    const planSet = new Set(plan.clearedCells);
    if (occSet.size !== planSet.size || !occupied.every((idx) => planSet.has(idx))) {
      return false;
    }

    const board = [...before.board];
    for (const idx of occupied) board[idx] = 0;
    const candidate: GameState = {
      ...before,
      board,
      status: RunStatus.PLAYING,
      continueUsed: true,
      undo: null,
      lastCleared: occupied,
      lastLines: 0,
      lastGain: 0,
    };
    if (!hasMove(candidate)) return false;
    this.current = candidate;
    return true;
  }

  private drawTray(trayIndex: number, rng: DeterministicRandom): { tray: Piece[]; nextIndex: number } {
    if (this.level && trayIndex < this.level.trays.length) {
      return {
        tray: this.level.piecesForTray(trayIndex),
        nextIndex: trayIndex + 1,
      };
    }
    const difficulty = this.level?.difficulty ?? Difficulty.NORMAL;
    return {
      tray: this.generator.generateTray(rng, difficulty),
      nextIndex: trayIndex + 1,
    };
  }

  static newClassic(seed: string | bigint | number): GameSession {
    return GameSession.create(GameMode.CLASSIC, null, seed);
  }

  static newDaily(seed: string | bigint | number): GameSession {
    return GameSession.create(GameMode.DAILY, null, seed);
  }

  static newLevel(level: LevelDefinition): GameSession {
    return GameSession.create(GameMode.LEVEL, level, level.seed);
  }

  static restore(mode: GameMode, level: LevelDefinition | null, state: GameState): GameSession {
    return new GameSession(mode, level, state);
  }

  private static create(
    mode: GameMode,
    level: LevelDefinition | null,
    seedInput: string | bigint | number
  ): GameSession {
    const generator = new PieceGenerator();
    const seed = BigInt.asIntN(64, BigInt(seedInput)).toString();
    const rng = new DeterministicRandom(seed);
    const board = level ? level.occupiedBoard() : emptyBoard();
    const targets = level ? [...level.targetCells].sort((a, b) => a - b) : [];

    let firstTray: Piece[];
    const trayIndex = 1;
    if (level) {
      firstTray = level.piecesForTray(0);
    } else {
      firstTray = generator.generateTray(rng, Difficulty.NORMAL);
    }

    let state: GameState = {
      board,
      remainingTargets: targets,
      tray: firstTray,
      trayIndex,
      score: 0,
      combo: 0,
      linesCleared: 0,
      movesUsed: 0,
      status: RunStatus.PLAYING,
      rngState: rng.state.toString(),
      seed,
      undo: null,
      continueUsed: false,
      lastCleared: [],
      lastLines: 0,
      lastGain: 0,
    };
    if (!hasMove(state)) {
      state = { ...state, status: RunStatus.LOST };
    }
    return new GameSession(mode, level, state, generator);
  }
}
