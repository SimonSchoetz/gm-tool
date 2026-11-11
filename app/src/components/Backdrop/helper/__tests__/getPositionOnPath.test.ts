import { describe, it, expect } from 'vitest';
import { getPositionOnPath } from '../getPositionOnPath';
import { getCumulativeLengths } from '../getCumulativeLengths';

const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];
const lengths = getCumulativeLengths(path); // [0, 100, 200]

describe('getPositionOnPath', () => {
  it('returns null for a path with fewer than 2 points', () => {
    expect(getPositionOnPath([{ x: 0, y: 0 }], [0], 0)).toBeNull();
  });

  it('returns a point within the first segment', () => {
    expect(getPositionOnPath(path, lengths, 50)).toEqual({ x: 50, y: 0 });
  });

  it('returns the exact corner point at a segment boundary', () => {
    expect(getPositionOnPath(path, lengths, 100)).toEqual({ x: 100, y: 0 });
  });

  it('returns a point in the second segment', () => {
    expect(getPositionOnPath(path, lengths, 150)).toEqual({ x: 100, y: 50 });
  });

  it('returns the last point when distance exceeds total path length', () => {
    expect(getPositionOnPath(path, lengths, 999)).toEqual({ x: 100, y: 100 });
  });

  it('returns the segment start point for a zero-length segment', () => {
    const degeneratePath = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const degenerateLengths = getCumulativeLengths(degeneratePath); // [0, 0, 100]
    expect(getPositionOnPath(degeneratePath, degenerateLengths, 0)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('getPositionOnPath on other shapes', () => {
  it('finds a point on a path of exactly two points', () => {
    const twoPoints = [
      { x: 0, y: 0 },
      { x: 0, y: 40 },
    ];

    expect(
      getPositionOnPath(twoPoints, getCumulativeLengths(twoPoints), 10),
    ).toEqual({ x: 0, y: 10 });
  });

  it('moves up along a segment that goes from a larger y to a smaller one', () => {
    const rising = [
      { x: 0, y: 100 },
      { x: 0, y: 0 },
    ];

    expect(getPositionOnPath(rising, getCumulativeLengths(rising), 25)).toEqual(
      { x: 0, y: 75 },
    );
  });

  it('moves along a segment that starts below the origin', () => {
    const offset = [
      { x: 0, y: 0 },
      { x: 0, y: 60 },
      { x: 60, y: 60 },
    ];

    expect(getPositionOnPath(offset, getCumulativeLengths(offset), 90)).toEqual(
      { x: 30, y: 60 },
    );
  });
});
