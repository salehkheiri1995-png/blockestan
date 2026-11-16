import { GameBalanceConfig } from './balance';
import { Difficulty, Piece, PieceShape } from './models';
import { DeterministicRandom } from './random';
import { ShapeCatalog } from './shapes';

type WeightedPool = Array<{ shape: PieceShape; weight: number }>;

function buildWeights(): Record<Difficulty, WeightedPool> {
  const result = {} as Record<Difficulty, WeightedPool>;
  for (const difficulty of [Difficulty.EASY, Difficulty.NORMAL, Difficulty.HARD]) {
    const configured = GameBalanceConfig.shapeWeights[difficulty];
    const pool: WeightedPool = [];
    for (const shape of ShapeCatalog.all) {
      const weight = configured[shape.name] ?? 0;
      if (weight > 0) {
        pool.push({ shape, weight });
      }
    }
    result[difficulty] = pool;
  }
  return result;
}

type ShapeFamily = 'line_h' | 'line_v' | 'corner' | 'tee' | 'skew' | 'box';

export function shapeFamilyOf(shapeName: string): ShapeFamily {
  if (shapeName === 'domino_h' || shapeName === 'line3_h' || shapeName === 'line4_h') {
    return 'line_h';
  }
  if (shapeName === 'domino_v' || shapeName === 'line3_v' || shapeName === 'line4_v') {
    return 'line_v';
  }
  if (shapeName.startsWith('l3_') || shapeName.startsWith('l4_')) {
    return 'corner';
  }
  if (shapeName.startsWith('t4_')) {
    return 'tee';
  }
  if (shapeName === 's4' || shapeName === 'z4') {
    return 'skew';
  }
  return 'box';
}

export class PieceGenerator {
  private readonly weights: Record<Difficulty, WeightedPool>;

  constructor() {
    this.weights = buildWeights();
  }

  generateTray(rng: DeterministicRandom, difficulty: Difficulty): Piece[] {
    const usedShapes = new Set<string>();
    const usedFamilies = new Set<ShapeFamily>();
    const usedColors = new Set<number>();
    const tray: Piece[] = [];

    for (let slot = 0; slot < 3; slot++) {
      const piece = this.pickDiversePiece(rng, difficulty, usedShapes, usedFamilies, usedColors);
      usedShapes.add(piece.shape.name);
      usedFamilies.add(shapeFamilyOf(piece.shape.name));
      usedColors.add(piece.color);
      tray.push(piece);
    }
    return tray;
  }

  pickDiversePiece(
    rng: DeterministicRandom,
    difficulty: Difficulty,
    excludedShapes: Set<string>,
    excludedFamilies: Set<ShapeFamily>,
    excludedColors: Set<number>
  ): Piece {
    const fullPool = this.weights[difficulty];
    // Prefer pieces that bring both a new shape AND a new geometric family
    let candidates = fullPool.filter(
      (item) =>
        !excludedShapes.has(item.shape.name) &&
        !excludedFamilies.has(shapeFamilyOf(item.shape.name))
    );
    if (candidates.length === 0) {
      // Fallback: at least a distinct shape name
      candidates = fullPool.filter((item) => !excludedShapes.has(item.shape.name));
    }
    if (candidates.length === 0) {
      candidates = fullPool;
    }

    const shape = this.pickFromPool(rng, candidates);
    const availableColors = [1, 2, 3, 4, 5].filter((c) => !excludedColors.has(c));
    const colorPool = availableColors.length > 0 ? availableColors : [1, 2, 3, 4, 5];
    const color = colorPool[rng.nextInt(colorPool.length)];
    return { shape, color };
  }

  randomPiece(rng: DeterministicRandom, difficulty: Difficulty): Piece {
    const shape = this.pickShape(rng, difficulty);
    return {
      shape,
      color: rng.nextInt(5) + 1,
    };
  }

  pickShape(rng: DeterministicRandom, difficulty: Difficulty): PieceShape {
    return this.pickFromPool(rng, this.weights[difficulty]);
  }

  private pickFromPool(rng: DeterministicRandom, pool: WeightedPool): PieceShape {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng.nextInt(total);
    for (const { shape, weight } of pool) {
      if (roll < weight) return shape;
      roll -= weight;
    }
    return pool[pool.length - 1].shape;
  }
}
