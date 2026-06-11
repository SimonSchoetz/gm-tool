import { describe, it, expect } from 'vitest';
import { generateZigzagPath } from '../generateZigzagPath';
import type { Grid } from '../../types';

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
