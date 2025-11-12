import { RefObject } from 'react';
import { Grid } from '../types';

enum Direction {
  LEFT = -1,
  RIGHT = 1,
  DOWN = 0,
}

export const generateZigzagPath = (
  gridRef: RefObject<Grid>
): { x: number; y: number }[] => {
  if (!gridRef.current) return [];
  const { squareSize, cols, rows, offsetX, offsetY } = gridRef.current;

  const path: { x: number; y: number }[] = [];
  let currentCol = Math.floor(Math.random() * cols);
  let currentRow = 0;
  const startSide = Math.random() < 0.5 ? 'left' : 'right';
  const offset = startSide === 'left' ? 0 : squareSize;

  // Starting position
  path.push({
    x: offsetX + currentCol * squareSize + offset,
    y: offsetY + currentRow * squareSize,
  });

  let direction: Direction = Direction.DOWN;

  const setDirection = () => {
    const shouldMoveHorizontally = Math.random() < 0.4;

    if (shouldMoveHorizontally) {
      if (direction !== Direction.LEFT && direction !== Direction.RIGHT) {
        direction = Math.random() < 0.5 ? Direction.LEFT : Direction.RIGHT;
      }
    } else if (direction !== Direction.DOWN) {
      direction = Direction.DOWN;
    }
  };

  while (currentRow <= rows) {
    setDirection();

    if (direction !== Direction.DOWN) {
      const newCol = Math.max(0, Math.min(cols - 1, currentCol + direction));

      if (newCol !== currentCol) {
        currentCol = newCol;
        path.push({
          x: offsetX + currentCol * squareSize + offset,
          y: offsetY + currentRow * squareSize,
        });
      }
    } else {
      currentRow++;
      if (currentRow <= rows) {
        path.push({
          x: offsetX + currentCol * squareSize + offset,
          y: offsetY + currentRow * squareSize,
        });
      }
    }
  }
  return path;
};
