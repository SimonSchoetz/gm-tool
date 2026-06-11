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

const makeOffscreenCtx = () => {
  const offscreenCtx = {
    fillStyle: '',
    fillRect: vi.fn(() => {
      fillStyleAtCall.push(offscreenCtx.fillStyle);
    }),
  };
  return offscreenCtx;
};

const asOffscreenContext = (ctx: ReturnType<typeof makeOffscreenCtx>) =>
  ctx as unknown as OffscreenCanvasRenderingContext2D;

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
    const offscreenCtx = makeOffscreenCtx();
    createGridTiles(makeGridRef(null), asOffscreenContext(offscreenCtx));
    expect(offscreenCtx.fillRect).not.toHaveBeenCalled();
  });

  it('fills each tile with the half-opacity background color', () => {
    const offscreenCtx = makeOffscreenCtx();
    createGridTiles(
      makeGridRef({ squareSize: 10, cols: 1, rows: 1, offsetX: 0, offsetY: 0 }),
      asOffscreenContext(offscreenCtx),
    );
    expect(fillStyleAtCall[1]).toBe('rgb(10, 20, 30, 0.5)');
  });

  it('sizes inner quads from (squareSize - 1) / 2', () => {
    const offscreenCtx = makeOffscreenCtx();
    createGridTiles(
      makeGridRef({ squareSize: 11, cols: 1, rows: 1, offsetX: 0, offsetY: 0 }),
      asOffscreenContext(offscreenCtx),
    );
    expect(offscreenCtx.fillRect).toHaveBeenCalledWith(0, 0, 5, 5);
  });

  it('fills every tile across the declared rows and cols', () => {
    const offscreenCtx = makeOffscreenCtx();
    createGridTiles(
      makeGridRef({ squareSize: 10, cols: 3, rows: 2, offsetX: 0, offsetY: 0 }),
      asOffscreenContext(offscreenCtx),
    );
    expect(offscreenCtx.fillRect).toHaveBeenCalledTimes(46);
  });
});
