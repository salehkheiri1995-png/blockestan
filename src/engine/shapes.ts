import { Cell, PieceShape } from './models';

function makeShape(name: string, coords: [number, number][]): PieceShape {
  const cells: Cell[] = coords.map(([row, col]) => ({ row, col }));
  const width = Math.max(...cells.map((c) => c.col)) + 1;
  const height = Math.max(...cells.map((c) => c.row)) + 1;
  return {
    name,
    cells,
    width,
    height,
    size: cells.length,
  };
}

export const Shapes = {
  SINGLE: makeShape('single', [[0, 0]]),

  DOMINO_H: makeShape('domino_h', [[0, 0], [0, 1]]),
  DOMINO_V: makeShape('domino_v', [[0, 0], [1, 0]]),

  LINE3_H: makeShape('line3_h', [[0, 0], [0, 1], [0, 2]]),
  LINE3_V: makeShape('line3_v', [[0, 0], [1, 0], [2, 0]]),

  LINE4_H: makeShape('line4_h', [[0, 0], [0, 1], [0, 2], [0, 3]]),
  LINE4_V: makeShape('line4_v', [[0, 0], [1, 0], [2, 0], [3, 0]]),

  SQUARE2: makeShape('square2', [[0, 0], [0, 1], [1, 0], [1, 1]]),

  RECT2X3: makeShape('rect2x3', [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]),
  RECT3X2: makeShape('rect3x2', [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]),

  L3_A: makeShape('l3_a', [[0, 0], [1, 0], [1, 1]]),
  L3_B: makeShape('l3_b', [[0, 1], [1, 0], [1, 1]]),
  L3_C: makeShape('l3_c', [[0, 0], [0, 1], [1, 0]]),
  L3_D: makeShape('l3_d', [[0, 0], [0, 1], [1, 1]]),

  L4_A: makeShape('l4_a', [[0, 0], [1, 0], [2, 0], [2, 1]]),
  L4_B: makeShape('l4_b', [[0, 1], [1, 1], [2, 0], [2, 1]]),
  L4_C: makeShape('l4_c', [[0, 0], [0, 1], [0, 2], [1, 0]]),
  L4_D: makeShape('l4_d', [[0, 0], [0, 1], [0, 2], [1, 2]]),

  T4_UP: makeShape('t4_up', [[0, 0], [0, 1], [0, 2], [1, 1]]),
  T4_DOWN: makeShape('t4_down', [[0, 1], [1, 0], [1, 1], [1, 2]]),
  T4_LEFT: makeShape('t4_left', [[0, 0], [1, 0], [2, 0], [1, 1]]),
  T4_RIGHT: makeShape('t4_right', [[0, 1], [1, 0], [1, 1], [2, 1]]),

  S4: makeShape('s4', [[0, 1], [0, 2], [1, 0], [1, 1]]),
  Z4: makeShape('z4', [[0, 0], [0, 1], [1, 1], [1, 2]]),
} as const;

const ALL_SHAPES: PieceShape[] = [
  Shapes.SINGLE,
  Shapes.DOMINO_H,
  Shapes.DOMINO_V,
  Shapes.LINE3_H,
  Shapes.LINE3_V,
  Shapes.LINE4_H,
  Shapes.LINE4_V,
  Shapes.SQUARE2,
  Shapes.RECT2X3,
  Shapes.RECT3X2,
  Shapes.L3_A,
  Shapes.L3_B,
  Shapes.L3_C,
  Shapes.L3_D,
  Shapes.L4_A,
  Shapes.L4_B,
  Shapes.L4_C,
  Shapes.L4_D,
  Shapes.T4_UP,
  Shapes.T4_DOWN,
  Shapes.T4_LEFT,
  Shapes.T4_RIGHT,
  Shapes.S4,
  Shapes.Z4,
];

const BY_NAME = new Map<string, PieceShape>(ALL_SHAPES.map((s) => [s.name, s]));

export const ShapeCatalog = {
  all: ALL_SHAPES,
  byName(name: string): PieceShape {
    const found = BY_NAME.get(name);
    if (!found) throw new Error(`Unknown shape '${name}'`);
    return found;
  },
  byNameOrNull(name: string): PieceShape | null {
    return BY_NAME.get(name) ?? null;
  },
  paletteColor(shape: PieceShape, slot: number, trayIndex = 0): number {
    const base = Math.max(0, ALL_SHAPES.findIndex((s) => s.name === shape.name));
    return ((base + slot + trayIndex) % 5) + 1;
  },
};
