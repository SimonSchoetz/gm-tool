import { afterEach, describe, it, expect, vi } from 'vitest';
import { generateZigzagPath } from '../generateZigzagPath';
import type { Grid } from '../../types/grid.type';

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const grid: NonNullable<Grid> = {
  squareSize: 50,
  cols: 4,
  rows: 3,
  offsetX: -25,
  offsetY: -25,
};

describe('generateZigzagPath', () => {
  it('returns an empty array when grid is null', () => {
    expect(generateZigzagPath(makeGridRef(null))).toEqual([]);
  });

  it('returns a path with at least 2 points', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    expect(path.length).toBeGreaterThanOrEqual(2);
  });

  it('starts at the top row of the grid (y equals offsetY)', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    expect(path[0].y).toBe(grid.offsetY);
  });

  it('ends one row below the declared grid height', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    const expectedEndY = grid.offsetY + (grid.rows + 1) * grid.squareSize;
    expect(path[path.length - 1].y).toBe(expectedEndY);
  });

  it('keeps all x coordinates within grid horizontal bounds', () => {
    const path = generateZigzagPath(makeGridRef(grid));
    const minX = grid.offsetX;
    const maxX = grid.offsetX + grid.cols * grid.squareSize;
    for (const point of path) {
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
    }
  });
});

// The path is a function of the random numbers it draws, so these tests feed it a script: the numbers are used in the order the generator asks for them (start column, start side, then per step whether to move sideways and, when it leaves going down, which way), and 0.9 once the script has run out, which never moves sideways and never picks the left.
const scriptRandom = (numbers: number[]) => {
  const queue = [...numbers];
  vi.spyOn(Math, 'random').mockImplementation(() => queue.shift() ?? 0.9);
};

const FOUR_COLUMNS: NonNullable<Grid> = {
  squareSize: 50,
  cols: 4,
  rows: 1,
  offsetX: -25,
  offsetY: -25,
};

const point = (col: number, row: number, sideOffset = 0) => ({
  x: FOUR_COLUMNS.offsetX + col * FOUR_COLUMNS.squareSize + sideOffset,
  y: FOUR_COLUMNS.offsetY + row * FOUR_COLUMNS.squareSize,
});

const scriptedPath = (numbers: number[]) => {
  scriptRandom(numbers);
  return generateZigzagPath(makeGridRef(FOUR_COLUMNS));
};

describe('generateZigzagPath with scripted random numbers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in the column the first number picks and goes straight down to one row below the grid', () => {
    expect(scriptedPath([0.5, 0.2])).toEqual([
      point(2, 0),
      point(2, 1),
      point(2, 2),
    ]);
  });

  it('puts a path that starts on the right side one square to the right', () => {
    expect(scriptedPath([0.5, 0.7])).toEqual([
      point(2, 0, FOUR_COLUMNS.squareSize),
      point(2, 1, FOUR_COLUMNS.squareSize),
      point(2, 2, FOUR_COLUMNS.squareSize),
    ]);
  });

  it('starts on the right side at exactly one half and on the left side below it', () => {
    expect(scriptedPath([0, 0.5])[0]).toEqual(
      point(0, 0, FOUR_COLUMNS.squareSize),
    );
    vi.restoreAllMocks();
    expect(scriptedPath([0, 0.49])[0]).toEqual(point(0, 0));
  });

  it('turns sideways when the draw is below 0.4 and keeps going the same way while it stays below 0.4, then turns down', () => {
    expect(scriptedPath([0, 0.2, 0.1, 0.9, 0.1]).slice(0, 5)).toEqual([
      point(0, 0),
      point(1, 0),
      point(2, 0),
      point(2, 1),
      point(2, 2),
    ]);
  });

  it('keeps its sideways direction without drawing again while the draws stay below 0.4', () => {
    expect(scriptedPath([0, 0.2, 0.1, 0.9, 0.1, 0.1])).toEqual([
      point(0, 0),
      point(1, 0),
      point(2, 0),
      point(3, 0),
      point(3, 1),
      point(3, 2),
    ]);
  });

  it('keeps going left without drawing again while the draws stay below 0.4', () => {
    expect(scriptedPath([0.99, 0.2, 0.1, 0.1, 0.1, 0.9])).toEqual([
      point(3, 0),
      point(2, 0),
      point(1, 0),
      point(1, 1),
      point(1, 2),
    ]);
  });

  it('still turns sideways on the last row, at the row below the grid', () => {
    expect(scriptedPath([0.5, 0.2, 0.9, 0.9, 0.1, 0.9])).toEqual([
      point(2, 0),
      point(2, 1),
      point(2, 2),
      point(3, 2),
    ]);
  });

  it('puts a sideways point of a path on the right side one square to the right as well', () => {
    expect(scriptedPath([0, 0.7, 0.1, 0.9])[1]).toEqual(
      point(1, 0, FOUR_COLUMNS.squareSize),
    );
  });

  it('turns left on a draw below one half and right on one half or more', () => {
    expect(scriptedPath([2 / 4, 0.2, 0.1, 0.1])[1]).toEqual(point(1, 0));
    vi.restoreAllMocks();
    expect(scriptedPath([2 / 4, 0.2, 0.1, 0.5])[1]).toEqual(point(3, 0));
  });

  it('moves down on a draw of exactly 0.4', () => {
    expect(scriptedPath([2 / 4, 0.2, 0.4])[1]).toEqual(point(2, 1));
  });

  it('adds no point for a sideways step that the left edge of the grid blocks', () => {
    expect(scriptedPath([0, 0.2, 0.1, 0.1])).toEqual([
      point(0, 0),
      point(0, 1),
      point(0, 2),
    ]);
  });

  it('adds no point for a sideways step that the right edge of the grid blocks', () => {
    expect(scriptedPath([0.99, 0.2, 0.1, 0.9])).toEqual([
      point(3, 0),
      point(3, 1),
      point(3, 2),
    ]);
  });

  it('records a sideways point at the row the path is in', () => {
    expect(scriptedPath([0.5, 0.2, 0.9, 0.1, 0.9])).toEqual([
      point(2, 0),
      point(2, 1),
      point(3, 1),
      point(3, 2),
    ]);
  });

  it('takes the start column from the first number scaled to the number of columns', () => {
    expect(scriptedPath([0.99, 0.2])[0]).toEqual(point(3, 0));
    vi.restoreAllMocks();
    expect(scriptedPath([0.0, 0.2])[0]).toEqual(point(0, 0));
  });
});
