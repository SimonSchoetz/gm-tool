import { describe, it, expect, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import type { Application, RenderTexture } from 'pixi.js';
import { tickBeams } from '../tickBeams';
import type { Beam } from '../../types';

const makeApp = (): Application =>
  ({ renderer: { render: vi.fn() } }) as unknown as Application;

const makeBeam = (overrides: Partial<Beam> = {}): Beam => ({
  path: [
    { x: 0, y: 0 },
    { x: 0, y: 120 },
  ],
  cumulativeLengths: [0, 120],
  headDistance: 0,
  speed: 0.4,
  active: false,
  spawnDelay: 0,
  ...overrides,
});

const makeArgs = (beams: Beam[], onIdle = vi.fn()) => ({
  beams,
  beamRenderTexture: {} as RenderTexture,
  primaryColor: '#39c3bb',
  app: makeApp(),
  headGraphics: new Graphics(),
  fadeGraphics: new Graphics(),
  deltaMS: 16,
  beamTailAlpha: 0.05,
  onIdle,
});

describe('tickBeams', () => {
  it('calls onIdle when all beams are inactive with no spawnDelay', () => {
    const onIdle = vi.fn();
    tickBeams(makeArgs([makeBeam({ active: false, spawnDelay: 0 })], onIdle));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('does not call onIdle when a beam has a positive spawnDelay', () => {
    const onIdle = vi.fn();
    tickBeams(
      makeArgs([makeBeam({ active: false, spawnDelay: 5000 })], onIdle),
    );
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('decrements spawnDelay by deltaMS each tick', () => {
    const beam = makeBeam({ active: false, spawnDelay: 1000 });
    tickBeams(makeArgs([beam]));
    expect(beam.spawnDelay).toBe(984);
  });

  it('activates beam and zeroes spawnDelay when countdown expires', () => {
    const beam = makeBeam({ active: false, spawnDelay: 10 });
    tickBeams(makeArgs([beam]));
    expect(beam.active).toBe(true);
    expect(beam.spawnDelay).toBe(0);
  });

  it('does not call onIdle when a beam is active and still travelling', () => {
    const onIdle = vi.fn();
    tickBeams(makeArgs([makeBeam({ active: true, headDistance: 0 })], onIdle));
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('advances headDistance by speed * deltaMS for active beams', () => {
    const beam = makeBeam({ active: true, headDistance: 0, speed: 0.5 });
    tickBeams(makeArgs([beam]));
    expect(beam.headDistance).toBeCloseTo(0.5 * 16);
  });

  it('deactivates beam when headDistance reaches total path length', () => {
    const beam = makeBeam({ active: true, headDistance: 115, speed: 0.5 });
    tickBeams(makeArgs([beam]));
    expect(beam.active).toBe(false);
  });
});
