import { describe, it, expect } from 'vitest';
import { getCumulativeLengths } from '../getCumulativeLengths';

describe('getCumulativeLengths', () => {
  it('returns [0] for an empty path', () => {
    expect(getCumulativeLengths([])).toEqual([0]);
  });

  it('returns [0] for a single-point path', () => {
    expect(getCumulativeLengths([{ x: 5, y: 5 }])).toEqual([0]);
  });

  it('returns prefix sums for a multi-segment path', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 3, y: 4 },
      { x: 6, y: 8 },
    ];
    // segment 0: length 5 (3-4-5 triangle)
    // segment 1: length 0 (duplicate point)
    // segment 2: length 5
    expect(getCumulativeLengths(path)).toEqual([0, 5, 5, 10]);
  });

  it('returns correct prefix sums for a right-angle path', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(getCumulativeLengths(path)).toEqual([0, 100, 200]);
  });
});
