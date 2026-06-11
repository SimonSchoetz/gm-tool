import { describe, it, expect } from 'vitest';
import { updateBeams } from '../updateBeams';
import { getCumulativeLengths } from '../getCumulativeLengths';
import type { Beam, Grid } from '../../types';

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const testGrid: NonNullable<Grid> = {
  squareSize: 50,
  cols: 4,
  rows: 3,
  offsetX: -25,
  offsetY: -25,
};

const makeBeamsRef = (beams: Beam[]): { current: Beam[] } => ({
  current: beams,
});

const makeActiveBeam = (): Beam => {
  const path = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
  ];
  const cumulativeLengths = getCumulativeLengths(path);
  return {
    path,
    cumulativeLengths,
    particles: [],
    color: 'rgb(65, 105, 225)',
    colorTriplet: '65, 105, 225',
    nextSpawnTime: 0,
    progress: 0,
    pathLength: 200,
    speed: 4,
    active: true,
    lastDrawnBounds: null,
  };
};

const makeInactiveBeam = (nextSpawnTime: number): Beam => ({
  path: [],
  cumulativeLengths: getCumulativeLengths([]),
  particles: [],
  color: 'rgb(65, 105, 225)',
  colorTriplet: '65, 105, 225',
  nextSpawnTime,
  progress: 0,
  pathLength: 0,
  speed: 4,
  active: false,
  lastDrawnBounds: null,
});

describe('updateBeams', () => {
  it('does not activate a beam whose nextSpawnTime has not passed', () => {
    const beam = makeInactiveBeam(300);
    updateBeams(makeBeamsRef([beam]), makeGridRef(testGrid), 200);
    expect(beam.active).toBe(false);
  });

  it('activates a beam when now exceeds its nextSpawnTime', () => {
    const beam = makeInactiveBeam(100);
    updateBeams(makeBeamsRef([beam]), makeGridRef(testGrid), 200);
    expect(beam.active).toBe(true);
    expect(beam.path.length).toBeGreaterThan(0);
  });

  it('advances progress by beam speed each tick', () => {
    const beam = makeActiveBeam();
    updateBeams(makeBeamsRef([beam]), makeGridRef(null), 0);
    expect(beam.progress).toBe(4);
  });

  it('ages particles and removes those that reach maxAge', () => {
    const beam = makeActiveBeam();
    beam.particles = [{ x: 0, y: 0, age: 19, maxAge: 20, progress: 0 }];
    updateBeams(makeBeamsRef([beam]), makeGridRef(null), 0);
    expect(beam.particles).toHaveLength(1);
    expect(beam.particles[0].age).toBe(1);
  });

  it('deactivates a beam when progress exceeds pathLength', () => {
    const beam = makeActiveBeam();
    beam.progress = 197;
    updateBeams(makeBeamsRef([beam]), makeGridRef(null), 0);
    expect(beam.active).toBe(false);
  });
});
