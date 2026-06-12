import { describe, it, expect, vi, afterEach } from 'vitest';
import { rebuildCanvas } from '../rebuildCanvas';
import type { Grid } from '../../types';

const makeVisibleCanvas = () =>
  ({
    width: 0,
    height: 0,
    style: { width: '', height: '' },
  }) as unknown as HTMLCanvasElement;

const makeCtx = () => ({
  scale: vi.fn(),
  drawImage: vi.fn(),
});

const asRenderingContext = (ctx: ReturnType<typeof makeCtx>) =>
  ctx as unknown as CanvasRenderingContext2D;

const makeOffscreenCtx = () => ({
  scale: vi.fn(),
  fillStyle: '',
  fillRect: vi.fn(),
});

// new OffscreenCanvas(...) requires a constructable value — an arrow-function
// stub cannot be constructed, so a class is the only erasable-syntax option.
const stubOffscreenCanvas = (offscreenCtx: unknown) => {
  const getContextSpy = vi.fn(() => offscreenCtx);
  class OffscreenCanvasStub {
    width: number;
    height: number;
    getContext = getContextSpy;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
  }
  vi.stubGlobal('OffscreenCanvas', OffscreenCanvasStub);
  return getContextSpy;
};

const makeRefs = (): {
  gridRef: { current: Grid };
  dprRef: { current: number };
  offscreenCanvasRef: { current: OffscreenCanvas | null };
} => ({
  gridRef: { current: null },
  dprRef: { current: 1 },
  offscreenCanvasRef: { current: null },
});

describe('rebuildCanvas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stores the device pixel ratio in dprRef', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    stubOffscreenCanvas(makeOffscreenCtx());
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(makeCtx()),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(dprRef.current).toBe(2);
  });

  it('falls back to a device pixel ratio of 1 when devicePixelRatio is 0', () => {
    vi.stubGlobal('devicePixelRatio', 0);
    stubOffscreenCanvas(makeOffscreenCtx());
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(makeCtx()),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(dprRef.current).toBe(1);
  });

  it('creates the offscreen canvas at device-pixel size and stores it in offscreenCanvasRef', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    stubOffscreenCanvas(makeOffscreenCtx());
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(makeCtx()),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(offscreenCanvasRef.current?.width).toBe(window.innerWidth * 2);
    expect(offscreenCanvasRef.current?.height).toBe(window.innerHeight * 2);
  });

  it('requests an opaque 2d context for the offscreen canvas', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    const getContextSpy = stubOffscreenCanvas(makeOffscreenCtx());
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(makeCtx()),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(getContextSpy).toHaveBeenCalledWith('2d', { alpha: false });
  });

  it('scales the offscreen context by dpr and paints the grid into it', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const offscreenCtx = makeOffscreenCtx();
    stubOffscreenCanvas(offscreenCtx);
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(makeCtx()),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(offscreenCtx.scale).toHaveBeenCalledWith(2, 2);
    expect(offscreenCtx.fillRect).toHaveBeenCalled();
    expect(gridRef.current).not.toBeNull();
  });

  it('blits the offscreen canvas onto the visible canvas even when the offscreen context is unavailable', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    stubOffscreenCanvas(null);
    const ctx = makeCtx();
    const { gridRef, dprRef, offscreenCanvasRef } = makeRefs();
    rebuildCanvas(
      makeVisibleCanvas(),
      asRenderingContext(ctx),
      gridRef,
      dprRef,
      offscreenCanvasRef,
    );
    expect(ctx.drawImage).toHaveBeenCalledWith(
      offscreenCanvasRef.current,
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      0,
      0,
      window.innerWidth,
      window.innerHeight,
    );
  });
});
