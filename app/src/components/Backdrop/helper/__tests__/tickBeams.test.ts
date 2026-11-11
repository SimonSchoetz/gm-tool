import { describe, it, expect, vi } from 'vitest';
import { Color, Graphics } from 'pixi.js';
import type { Application, RenderTexture } from 'pixi.js';
import { BEAM_TAIL_ALPHA, tickBeams } from '../tickBeams';
import type { Beam } from '../../types/beam.type';

const render = vi.fn();

const makeApp = (): Application =>
  ({ renderer: { render } }) as unknown as Application;

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
  it('fades the trail with black at the beam tail alpha', () => {
    const args = makeArgs([makeBeam()]);
    const fill = vi.spyOn(args.fadeGraphics, 'fill');
    tickBeams(args);
    expect(fill).toHaveBeenCalledWith({
      color: 'black',
      alpha: BEAM_TAIL_ALPHA,
    });
  });
});

describe('tickBeams drawing', () => {
  const LShape = (overrides: Partial<Beam> = {}) =>
    makeBeam({
      path: [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
      ],
      cumulativeLengths: [0, 100, 200],
      speed: 0.5,
      active: true,
      ...overrides,
    });

  const spies = (args: ReturnType<typeof makeArgs>) => ({
    moveTo: vi.spyOn(args.headGraphics, 'moveTo'),
    lineTo: vi.spyOn(args.headGraphics, 'lineTo'),
    stroke: vi.spyOn(args.headGraphics, 'stroke'),
    clear: vi.spyOn(args.headGraphics, 'clear'),
  });

  it('renders the fade, then the heads, onto the beam texture without clearing it', () => {
    render.mockClear();
    const args = makeArgs([LShape({ headDistance: 10 })]);

    tickBeams(args);

    expect(render).toHaveBeenNthCalledWith(1, {
      container: args.fadeGraphics,
      target: args.beamRenderTexture,
      clear: false,
    });
    expect(render).toHaveBeenNthCalledWith(2, {
      container: args.headGraphics,
      target: args.beamRenderTexture,
      clear: false,
    });
  });

  it('draws the head as a one pixel line from the previous position to the new one in the primary color', () => {
    const args = makeArgs([LShape({ headDistance: 20 })]);
    const { moveTo, lineTo, stroke, clear } = spies(args);

    tickBeams(args);

    expect(clear).toHaveBeenCalled();
    expect(moveTo).toHaveBeenCalledWith(0, 20);
    expect(lineTo).toHaveBeenCalledTimes(1);
    expect(lineTo.mock.calls[0][0]).toBe(0);
    expect(lineTo.mock.calls[0][1]).toBeCloseTo(28);
    expect(stroke).toHaveBeenCalledTimes(1);
    const [style] = stroke.mock.calls[0];
    expect(style).toMatchObject({ width: 1, alpha: 1 });
    expect((style as { color: Color }).color.toHex()).toBe(
      new Color('#39c3bb').toHex(),
    );
  });

  it('passes a corner of the path that lies between the previous and the new position', () => {
    const args = makeArgs([LShape({ headDistance: 95 })]);
    const { lineTo } = spies(args);

    tickBeams(args);

    expect(lineTo.mock.calls).toEqual([
      [0, 100],
      [3, 100],
    ]);
  });

  it.each([
    ['at the previous position', 100, 0],
    ['at the new position', 92, 0],
  ])('does not pass a corner %s', (_where, headDistance) => {
    const args = makeArgs([LShape({ headDistance })]);
    const { lineTo } = spies(args);

    tickBeams(args);

    expect(lineTo).toHaveBeenCalledTimes(1);
  });

  it('starts the line at the beam start for a beam that has not moved yet', () => {
    const args = makeArgs([LShape({ headDistance: 0 })]);
    const { moveTo } = spies(args);

    tickBeams(args);

    expect(moveTo).toHaveBeenCalledWith(0, 0);
  });

  it('activates a beam whose delay runs out exactly on this tick', () => {
    const beam = makeBeam({ active: false, spawnDelay: 16 });

    tickBeams(makeArgs([beam]));

    expect(beam.active).toBe(true);
    expect(beam.spawnDelay).toBe(0);
  });

  it('keeps a beam going until its head reaches the end of the whole path, not of its first segment', () => {
    const beam = LShape({ headDistance: 120 });

    tickBeams(makeArgs([beam]));

    expect(beam.active).toBe(true);
  });

  it('ends a beam whose head arrives exactly at the end of the path', () => {
    const beam = LShape({ headDistance: 192 });

    tickBeams(makeArgs([beam]));

    expect(beam.active).toBe(false);
  });
});
