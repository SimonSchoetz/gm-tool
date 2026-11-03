import { describe, it, expect } from 'vitest';
import { computePanDelta } from '../computePanDelta';

describe('computePanDelta', () => {
  it('full container width drag at zoom 1 produces dx=100', () => {
    expect(computePanDelta(800, 0, 800, 600, 1).dx).toBe(100);
  });

  it('full container width drag at zoom 2 produces dx=50', () => {
    expect(computePanDelta(800, 0, 800, 600, 2).dx).toBe(50);
  });

  it('zero drag produces zero delta', () => {
    expect(computePanDelta(0, 0, 800, 600, 1)).toEqual({ dx: 0, dy: 0 });
  });

  it('negative dx produces negative result', () => {
    expect(computePanDelta(-400, 0, 800, 600, 1).dx).toBe(-50);
  });

  it('dy uses containerHeight for normalization', () => {
    expect(computePanDelta(0, 600, 800, 600, 1).dy).toBe(100);
  });
});
