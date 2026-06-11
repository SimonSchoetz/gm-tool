import { describe, it, expect } from 'vitest';
import { initBeams } from '../initBeams';
import type { Beam } from '../../types';

const makeBeamsRef = (): { current: Beam[] } => ({ current: [] });

describe('initBeams', () => {
  it('creates the specified number of beams', () => {
    const beamsRef = makeBeamsRef();
    initBeams(beamsRef, 3, 4, 0);
    expect(beamsRef.current).toHaveLength(3);
  });

  it('each beam starts inactive with empty path and particles', () => {
    const beamsRef = makeBeamsRef();
    initBeams(beamsRef, 1, 4, 0);
    const beam = beamsRef.current[0];
    expect(beam.active).toBe(false);
    expect(beam.path).toEqual([]);
    expect(beam.particles).toEqual([]);
    expect(beam.progress).toBe(0);
    expect(beam.pathLength).toBe(0);
  });

  it('speed increments by index starting from beamSpeed', () => {
    const beamsRef = makeBeamsRef();
    initBeams(beamsRef, 3, 4, 0);
    expect(beamsRef.current.map((beam) => beam.speed)).toEqual([4, 5, 6]);
  });

  it('nextSpawnTime falls within [now + i*2000, now + i*2000 + 10000] for each beam', () => {
    const beamsRef = makeBeamsRef();
    initBeams(beamsRef, 3, 4, 50000);
    beamsRef.current.forEach((beam, i) => {
      expect(beam.nextSpawnTime).toBeGreaterThanOrEqual(50000 + i * 2000);
      expect(beam.nextSpawnTime).toBeLessThanOrEqual(50000 + i * 2000 + 10000);
    });
  });
});
