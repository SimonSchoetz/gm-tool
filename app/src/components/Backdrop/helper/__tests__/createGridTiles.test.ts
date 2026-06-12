import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGridTiles } from '../createGridTiles';
import type { Grid } from '../../types';

const makeGridRef = (grid: Grid): { current: Grid } => ({ current: grid });

const cssVariables = new Map([
  ['--color-primary-rgb', '0, 0, 128'],
  ['--color-bg-rgb', '10, 20, 30'],
  ['--color-bg', '#0a141e'],
]);

let fillStyleAtCall: string[] = [];

const makeCtx = () => {
  const ctx = {
    fillStyle: '',
    fillRect: vi.fn(() => {
      fillStyleAtCall.push(ctx.fillStyle);
    }),
  };
  return ctx;
};

const asRenderingContext = (ctx: ReturnType<typeof makeCtx>) =>
  ctx as unknown as CanvasRenderingContext2D;

describe('createGridTiles', () => {
  beforeEach(() => {
    fillStyleAtCall = [];
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => cssVariables.get(prop) ?? '',
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('draws nothing when the grid is null', () => {
    const ctx = makeCtx();
    createGridTiles(makeGridRef(null), asRenderingContext(ctx));
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('fills each tile with the half-opacity background color', () => {
    const ctx = makeCtx();
    createGridTiles(
      makeGridRef({ squareSize: 10, cols: 1, rows: 1, offsetX: 0, offsetY: 0 }),
      asRenderingContext(ctx),
    );
    expect(fillStyleAtCall[1]).toBe('rgb(10, 20, 30, 0.5)');
  });

  it('sizes inner quads from (squareSize - 1) / 2', () => {
    const ctx = makeCtx();
    createGridTiles(
      makeGridRef({ squareSize: 11, cols: 1, rows: 1, offsetX: 0, offsetY: 0 }),
      asRenderingContext(ctx),
    );
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 5, 5);
  });

  it('fills every tile across the declared rows and cols', () => {
    const ctx = makeCtx();
    createGridTiles(
      makeGridRef({ squareSize: 10, cols: 3, rows: 2, offsetX: 0, offsetY: 0 }),
      asRenderingContext(ctx),
    );
    expect(ctx.fillRect).toHaveBeenCalledTimes(46);
  });
});
