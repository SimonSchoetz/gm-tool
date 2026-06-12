import { RefObject } from 'react';
import { Grid } from '../types';
import { createGridTiles } from './createGridTiles';
import { setCanvasSize } from './setCanvasSize';
import { setGridDimensions } from './setGridDimensions';

export const rebuildCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  gridRef: RefObject<Grid>,
  dprRef: RefObject<number>,
  offscreenCanvasRef: RefObject<OffscreenCanvas | null>,
) => {
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  const dpr = window.devicePixelRatio || 1;
  dprRef.current = dpr;
  const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
  offscreenCanvasRef.current = offscreen;
  // alpha: false stores the grid as opaque pixels — a transparent offscreen
  // would make every dirty-rect restore blend over old beam pixels instead of
  // replacing them, leaving permanent trails
  const offscreenCtx = offscreen.getContext('2d', { alpha: false });
  if (offscreenCtx) {
    offscreenCtx.scale(dpr, dpr);
    // explicit opaque base: engines may ignore the alpha context option on
    // OffscreenCanvas, and the grid fills are semi-transparent washes — every
    // restore blit must overwrite old beam pixels, never blend over them
    offscreenCtx.fillStyle = '#000';
    offscreenCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    createGridTiles(gridRef, offscreenCtx);
  }
  ctx.drawImage(
    offscreen,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    window.innerWidth,
    window.innerHeight,
  );
};
