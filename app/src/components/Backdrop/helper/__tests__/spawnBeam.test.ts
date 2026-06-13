import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnBeam } from '../spawnBeam';
import type { Beam } from '../../types';
import type { Grid } from '../../types';

vi.mock('../generateZigzagPath', () => ({
  generateZigzagPath: vi.fn(() => [
    { x: 0, y: 0 },
    { x: 60, y: 120 },
  ]),
}));

vi.mock('../getCumulativeLengths', () => ({
  getCumulativeLengths: vi.fn(() => [0, 134]),
}));

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const makeBeam = (): Beam => ({
  path: [],
  cumulativeLengths: [],
  headDistance: 99,
  speed: 0,
  active: false,
  spawnDelay: 0,
});

const gridRef = makeGridRef({
  squareSize: 120,
  cols: 10,
  rows: 8,
  offsetX: -60,
  offsetY: -60,
});

describe('spawnBeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets headDistance to 0', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef);
    expect(beam.headDistance).toBe(0);
  });

  it('sets path from generateZigzagPath', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef);
    expect(beam.path).toEqual([
      { x: 0, y: 0 },
      { x: 60, y: 120 },
    ]);
  });

  it('sets cumulativeLengths from getCumulativeLengths', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef);
    expect(beam.cumulativeLengths).toEqual([0, 134]);
  });

  it('activates beam immediately when delay is 0', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef, 0);
    expect(beam.active).toBe(true);
    expect(beam.spawnDelay).toBe(0);
  });

  it('defers beam activation when delay is positive', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef, 5000);
    expect(beam.active).toBe(false);
    expect(beam.spawnDelay).toBe(5000);
  });

  it('sets a positive speed', () => {
    const beam = makeBeam();
    spawnBeam(beam, gridRef);
    expect(beam.speed).toBeGreaterThan(0);
  });
});
