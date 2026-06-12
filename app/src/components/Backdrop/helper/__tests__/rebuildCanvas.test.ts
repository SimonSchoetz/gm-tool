import { describe, it, expect, vi, afterEach } from 'vitest';
import { rebuildCanvas } from '../rebuildCanvas';
import type { Grid } from '../../types';

const makeCanvas = () =>
  ({
    width: 0,
    height: 0,
    style: { width: '', height: '' },
  }) as unknown as HTMLCanvasElement;

const makeCtx = () => ({
  scale: vi.fn(),
  fillStyle: '',
  fillRect: vi.fn(),
});

const asRenderingContext = (ctx: ReturnType<typeof makeCtx>) =>
  ctx as unknown as CanvasRenderingContext2D;

const makeGridRef = (): { current: Grid } => ({ current: null });

describe('rebuildCanvas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sizes the canvas buffer to device pixels', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const canvas = makeCanvas();
    rebuildCanvas(canvas, asRenderingContext(makeCtx()), makeGridRef());
    expect(canvas.width).toBe(window.innerWidth * 2);
    expect(canvas.height).toBe(window.innerHeight * 2);
  });

  it('derives the grid dimensions', () => {
    const gridRef = makeGridRef();
    rebuildCanvas(makeCanvas(), asRenderingContext(makeCtx()), gridRef);
    expect(gridRef.current).not.toBeNull();
  });

  it('paints the grid tiles', () => {
    const ctx = makeCtx();
    rebuildCanvas(makeCanvas(), asRenderingContext(ctx), makeGridRef());
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
