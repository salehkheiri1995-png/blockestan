export const BOARD_SIZE = 8;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const NEUTRAL_BLOCK_COLOR = 6;
export const MAX_PIECE_COLOR = 5;

export enum GameMode {
  CLASSIC = 'CLASSIC',
  LEVEL = 'LEVEL',
  DAILY = 'DAILY',
}

export enum RunStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
}

export enum GoalType {
  SCORE = 'SCORE',
  LINES = 'LINES',
  TARGET_CELLS = 'TARGET_CELLS',
}

export interface Cell {
  row: number;
  col: number;
}

export interface PieceShape {
  name: string;
  cells: Cell[];
  width: number;
  height: number;
  size: number;
}

export interface Piece {
  shape: PieceShape;
  color: number;
}

export interface LevelGoal {
  type: GoalType;
  target: number;
}

export interface StarThresholds {
  twoStars: number;
  threeStars: number;
}

export interface UndoSnapshot {
  board: number[];
  remainingTargets: number[];
  tray: (Piece | null)[];
  trayIndex: number;
  score: number;
  combo: number;
  linesCleared: number;
  movesUsed: number;
  status: RunStatus;
  rngState: string;
  continueUsed: boolean;
}

export interface GameState {
  board: number[];
  remainingTargets: number[];
  tray: (Piece | null)[];
  trayIndex: number;
  score: number;
  combo: number;
  linesCleared: number;
  movesUsed: number;
  status: RunStatus;
  rngState: string;
  seed: string;
  undo: UndoSnapshot | null;
  continueUsed: boolean;
  lastCleared: number[];
  lastLines: number;
  lastGain: number;
}

export enum PlacementError {
  NOT_PLAYING = 'NOT_PLAYING',
  EMPTY_SLOT = 'EMPTY_SLOT',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  OVERLAP = 'OVERLAP',
  NO_LEGAL_MOVE = 'NO_LEGAL_MOVE',
}

export type PlacementOutcome =
  | { ok: false; reason: PlacementError }
  | {
      ok: true;
      gainedScore: number;
      placedCells: number;
      clearedCells: number[];
      clearedRows: number[];
      clearedColumns: number[];
      lines: number;
      combo: number;
      status: RunStatus;
    };

export interface RescuePlan {
  centerRow: number;
  centerCol: number;
  clearedCells: number[];
}

export type BoosterOutcome =
  | { type: 'Applied'; clearedCells: number[] }
  | { type: 'NotApplicable' }
  | { type: 'Rejected'; reason: string };

export function indexOf(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function rowOf(index: number): number {
  return Math.floor(index / BOARD_SIZE);
}

export function colOf(index: number): number {
  return index % BOARD_SIZE;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function inBoundsIndex(index: number): boolean {
  return index >= 0 && index < CELL_COUNT;
}

export function emptyBoard(): number[] {
  return new Array<number>(CELL_COUNT).fill(0);
}

export function boardFromRows(rows: string[]): number[] {
  if (rows.length !== BOARD_SIZE) {
    throw new Error(`Board must have ${BOARD_SIZE} rows`);
  }
  const cells = new Array<number>(CELL_COUNT).fill(0);
  rows.forEach((line, row) => {
    if (line.length !== BOARD_SIZE) {
      throw new Error(`Row ${row} must have ${BOARD_SIZE} characters`);
    }
    for (let col = 0; col < BOARD_SIZE; col++) {
      const ch = line[col];
      cells[indexOf(row, col)] = ch === '.' ? 0 : ch === '#' ? NEUTRAL_BLOCK_COLOR : 0;
    }
  });
  return cells;
}

export function fullRowIndices(board: number[]): number[] {
  const rows: number[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    let full = true;
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[indexOf(row, col)] === 0) {
        full = false;
        break;
      }
    }
    if (full) rows.push(row);
  }
  return rows;
}

export function fullColumnIndices(board: number[]): number[] {
  const cols: number[] = [];
  for (let col = 0; col < BOARD_SIZE; col++) {
    let full = true;
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (board[indexOf(row, col)] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(col);
  }
  return cols;
}

export function cellsInFullLines(board: number[]): number[] {
  const set = new Set<number>();
  for (const row of fullRowIndices(board)) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      set.add(indexOf(row, col));
    }
  }
  for (const col of fullColumnIndices(board)) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      set.add(indexOf(row, col));
    }
  }
  return Array.from(set);
}

export function canPieceFit(board: number[], shape: PieceShape): boolean {
  const maxRow = BOARD_SIZE - shape.height;
  const maxCol = BOARD_SIZE - shape.width;
  if (maxRow < 0 || maxCol < 0) return false;
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= maxCol; col++) {
      const fits = shape.cells.every((cell) => board[indexOf(row + cell.row, col + cell.col)] === 0);
      if (fits) return true;
    }
  }
  return false;
}

export function hasMove(state: GameState): boolean {
  if (state.status !== RunStatus.PLAYING) return false;
  return state.tray.some((piece) => piece !== null && canPieceFit(state.board, piece.shape));
}

export function toUndoSnapshot(state: GameState): UndoSnapshot {
  return {
    board: [...state.board],
    remainingTargets: [...state.remainingTargets],
    tray: state.tray.map((p) => (p ? { shape: p.shape, color: p.color } : null)),
    trayIndex: state.trayIndex,
    score: state.score,
    combo: state.combo,
    linesCleared: state.linesCleared,
    movesUsed: state.movesUsed,
    status: state.status,
    rngState: state.rngState,
    continueUsed: state.continueUsed,
  };
}

export function undoSnapshotToState(snapshot: UndoSnapshot, seed: string): GameState {
  return {
    board: [...snapshot.board],
    remainingTargets: [...snapshot.remainingTargets],
    tray: snapshot.tray.map((p) => (p ? { shape: p.shape, color: p.color } : null)),
    trayIndex: snapshot.trayIndex,
    score: snapshot.score,
    combo: snapshot.combo,
    linesCleared: snapshot.linesCleared,
    movesUsed: snapshot.movesUsed,
    status: snapshot.status,
    rngState: snapshot.rngState,
    seed,
    undo: null,
    continueUsed: snapshot.continueUsed,
    lastCleared: [],
    lastLines: 0,
    lastGain: 0,
  };
}
