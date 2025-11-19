import { RefObject } from 'react';
import { getColor } from './getColor';
import { Grid } from '../types';

export const createGridTiles = (
  gridRef: RefObject<Grid>,
  ctx: CanvasRenderingContext2D
) => {
  if (!gridRef.current) return;
  const { squareSize, cols, rows, offsetX, offsetY } = gridRef.current;

  // Background
  const primaryRgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-rgb')
    .trim();
  ctx.fillStyle = `rgba(${primaryRgb}, 0.1)`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Draw grid squares
  const bgColor = getColor('--color-bg');
  const bgRgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg-rgb')
    .trim();
  const bg50Color = `rgba(${bgRgb}, 0.5)`;

  for (let row = 0; row < rows + 1; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * squareSize;
      const y = offsetY + row * squareSize;

      // Outer square
      ctx.fillStyle = bg50Color;
      ctx.fillRect(x, y, squareSize - 0.5, squareSize - 0.5);

      // Inner 2x2 grid
      const innerSize = (squareSize - 1) / 2;
      ctx.fillStyle = bgColor;

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillRect(
            x + j * innerSize + (j > 0 ? 1 : 0),
            y + i * innerSize + (i > 0 ? 1 : 0),
            innerSize - (j > 0 ? 1 : 0),
            innerSize - (i > 0 ? 1 : 0)
          );
        }
      }
    }
  }
};
