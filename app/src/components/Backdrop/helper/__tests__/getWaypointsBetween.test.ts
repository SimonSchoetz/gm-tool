import { describe, it, expect } from 'vitest';
import { getWaypointsBetween } from '../getWaypointsBetween';

const path = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('getWaypointsBetween', () => {
  it('returns only start and end when both progress values are within the same segment', () => {
    const result = getWaypointsBetween(path, 10, 50);
    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 50, y: 0 },
    ]);
  });

  it('includes one corner vertex when the range spans a single corner', () => {
    const result = getWaypointsBetween(path, 50, 150);
    expect(result).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
    ]);
  });

  it('includes two corner vertices when the range spans two corners', () => {
    const result = getWaypointsBetween(path, 50, 250);
    expect(result).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 50, y: 100 },
    ]);
  });
});
