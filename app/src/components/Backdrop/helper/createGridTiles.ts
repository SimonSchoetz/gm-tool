import { RefObject } from 'react';
import { getColor } from './getColor';
import { Grid } from '../types';

export const createGridTiles = (
  gridRef: RefObject<Grid>,
  offscreenCtx: OffscreenCanvasRenderingContext2D,
) => {
  if (!gridRef.current) return;
  const { squareSize, cols, rows, offsetX, offsetY } = gridRef.current;

  const primaryRgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-rgb')
    .trim();
  offscreenCtx.fillStyle = `rgb(${primaryRgb}, 0.1)`;
  offscreenCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const bgColor = getColor('--color-bg');
  const bgRgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg-rgb')
    .trim();
  const bg50Color = `rgb(${bgRgb}, 0.5)`;

  for (let row = 0; row < rows + 1; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * squareSize;
      const y = offsetY + row * squareSize;

      offscreenCtx.fillStyle = bg50Color;
      offscreenCtx.fillRect(x, y, squareSize - 0.5, squareSize - 0.5);

      const innerSize = (squareSize - 1) / 2;
      offscreenCtx.fillStyle = bgColor;

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          offscreenCtx.fillRect(
            x + j * innerSize + (j > 0 ? 1 : 0),
            y + i * innerSize + (i > 0 ? 1 : 0),
            innerSize - (j > 0 ? 1 : 0),
            innerSize - (i > 0 ? 1 : 0),
          );
        }
      }
    }
  }
};
