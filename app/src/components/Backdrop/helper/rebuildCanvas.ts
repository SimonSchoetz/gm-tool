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
  const offscreenCtx = offscreen.getContext('2d');
  if (offscreenCtx) {
    offscreenCtx.scale(dpr, dpr);
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
