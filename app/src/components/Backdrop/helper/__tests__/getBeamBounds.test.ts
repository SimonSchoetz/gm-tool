import { describe, it, expect } from 'vitest';
import { getBeamBounds } from '../getBeamBounds';
import { getCumulativeLengths } from '../getCumulativeLengths';
import { BEAM_BOUNDS_PADDING } from '../../Backdrop.constants';
import type { Beam } from '../../types';

const makePath = () => [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];

const makeBeam = (particles: Beam['particles']): Beam => {
  const path = makePath();
  return {
    path,
    cumulativeLengths: getCumulativeLengths(path),
    particles,
    color: 'rgb(65, 105, 225)',
    colorTriplet: '65, 105, 225',
    nextSpawnTime: 0,
    progress: 0,
    pathLength: 200,
    speed: 4,
    active: false,
    lastDrawnBounds: null,
  };
};

const makeParticle = (progress: number) => ({
  x: 0,
  y: 0,
  age: 0,
  maxAge: 20,
  progress,
});

describe('getBeamBounds', () => {
  it('returns null when the beam has no particles', () => {
    expect(getBeamBounds(makeBeam([]), 4)).toBeNull();
  });

  it('returns a padded bounds when the beam has a single particle within one segment', () => {
    const beam = makeBeam([makeParticle(25), makeParticle(75)]);
    const result = getBeamBounds(beam, 0);
    // Waypoints: {x:25,y:0} to {x:75,y:0} — horizontal segment, y is constant
    expect(result).toEqual({ x: 25, y: 0, width: 50, height: 0 });
  });

  it('applies padding uniformly on all sides', () => {
    const beam = makeBeam([makeParticle(25), makeParticle(75)]);
    const result = getBeamBounds(beam, BEAM_BOUNDS_PADDING);
    expect(result).toEqual({ x: 21, y: -4, width: 58, height: 8 });
  });

  it('includes path corner vertices when the trail spans a segment boundary', () => {
    // Progress 50 → 150 spans the corner at x:100,y:0 (cumulative 100)
    const beam = makeBeam([makeParticle(50), makeParticle(150)]);
    const result = getBeamBounds(beam, 0);
    // Waypoints: {x:50,y:0}, {x:100,y:0}, {x:100,y:50}
    // Bounding box: minX=50, maxX=100, minY=0, maxY=50
    expect(result).toEqual({ x: 50, y: 0, width: 50, height: 50 });
  });
});
