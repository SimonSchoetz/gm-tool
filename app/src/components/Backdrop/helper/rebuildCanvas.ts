import { RefObject } from 'react';
import { Grid } from '../types';
import { createGridTiles } from './createGridTiles';
import { setCanvasSize } from './setCanvasSize';
import { setGridDimensions } from './setGridDimensions';

export const rebuildCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  gridRef: RefObject<Grid>,
) => {
  setCanvasSize(canvas, ctx);
  setGridDimensions(gridRef);
  createGridTiles(gridRef, ctx);
};
