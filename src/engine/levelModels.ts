import {
  boardFromRows,
  Difficulty,
  LevelGoal,
  Piece,
  StarThresholds,
} from './models';
import { ShapeCatalog } from './shapes';

export interface PieceSpec {
  shape: string;
  color?: number;
}

export interface ReferenceMove {
  tray: number;
  slot: number;
  row: number;
  col: number;
}

export interface RawLevelDefinition {
  id: number;
  title: string;
  hint: string;
  seed: number;
  initialBoard: string[];
  targetCells: number[];
  goals: LevelGoal[];
  moveLimit: number;
  trays: PieceSpec[][];
  difficulty: Difficulty;
  starThresholds: StarThresholds;
  referenceSolution: ReferenceMove[];
}

export interface LevelDefinition extends RawLevelDefinition {
  occupiedBoard(): number[];
  piecesForTray(trayIndex: number): Piece[];
}

export interface LevelCatalogFile {
  formatVersion: number;
  generatorVersion: number;
  levels: RawLevelDefinition[];
}

export function hydrateLevel(raw: RawLevelDefinition): LevelDefinition {
  return {
    ...raw,
    occupiedBoard(): number[] {
      return boardFromRows(raw.initialBoard);
    },
    piecesForTray(trayIndex: number): Piece[] {
      const tray = raw.trays[trayIndex];
      if (!tray || tray.length !== 3) {
        throw new Error(`Level ${raw.id} tray ${trayIndex} must have three pieces`);
      }
      return tray.map((spec, slot) => {
        const shape = ShapeCatalog.byName(spec.shape);
        const color =
          spec.color && spec.color >= 1 && spec.color <= 5
            ? spec.color
            : ShapeCatalog.paletteColor(shape, slot, trayIndex);
        return { shape, color };
      });
    },
  };
}
