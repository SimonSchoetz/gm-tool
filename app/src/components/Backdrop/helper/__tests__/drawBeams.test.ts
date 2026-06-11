import { describe, it, expect, vi } from 'vitest';
import { drawBeams } from '../drawBeams';
import type { Beam } from '../../types';

const makeCtx = () => ({
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
});

const asRenderingContext = (ctx: ReturnType<typeof makeCtx>) =>
  ctx as unknown as CanvasRenderingContext2D;

const makeBeamsRef = (beams: Beam[]): { current: Beam[] } => ({
  current: beams,
});

const makeBeam = (
  particles: Beam['particles'],
  colorTriplet: string | null = '65, 105, 225',
): Beam => ({
  path: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
  cumulativeLengths: [0, 100],
  particles,
  color: 'rgb(255, 0, 0)',
  colorTriplet,
  nextSpawnTime: 0,
  progress: 0,
  pathLength: 100,
  speed: 4,
  active: true,
  lastDrawnBounds: null,
});

const makeParticle = (progress: number, age: number, maxAge: number) => ({
  x: progress,
  y: 0,
  age,
  maxAge,
  progress,
});

describe('drawBeams', () => {
  it('draws nothing for a beam without particles', () => {
    const ctx = makeCtx();
    drawBeams(makeBeamsRef([makeBeam([])]), asRenderingContext(ctx));
    expect(ctx.beginPath).not.toHaveBeenCalled();
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('derives full opacity for a particle with age 0', () => {
    const ctx = makeCtx();
    const beam = makeBeam([makeParticle(10, 0, 20)]);
    drawBeams(makeBeamsRef([beam]), asRenderingContext(ctx));
    expect(ctx.strokeStyle).toBe('rgb(65, 105, 225, 1)');
    expect(ctx.strokeStyle).not.toBe(beam.color);
  });

  it('derives zero opacity for a particle whose age equals maxAge', () => {
    const ctx = makeCtx();
    const beam = makeBeam([makeParticle(10, 20, 20)]);
    drawBeams(makeBeamsRef([beam]), asRenderingContext(ctx));
    expect(ctx.strokeStyle).toBe('rgb(65, 105, 225, 0)');
  });

  it('falls back to beam.color when colorTriplet is null', () => {
    const ctx = makeCtx();
    const beam = makeBeam([makeParticle(10, 0, 20)], null);
    drawBeams(makeBeamsRef([beam]), asRenderingContext(ctx));
    expect(ctx.strokeStyle).toBe('rgb(255, 0, 0)');
  });

  it('draws the head dot for the last particle', () => {
    const ctx = makeCtx();
    const beam = makeBeam([makeParticle(10, 0, 20)]);
    drawBeams(makeBeamsRef([beam]), asRenderingContext(ctx));
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
    expect(ctx.fillStyle).toBe(beam.color);
  });

  it('strokes a segment between consecutive particles', () => {
    const ctx = makeCtx();
    const beam = makeBeam([makeParticle(10, 5, 20), makeParticle(90, 0, 20)]);
    drawBeams(makeBeamsRef([beam]), asRenderingContext(ctx));
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(90, 0);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });
});
