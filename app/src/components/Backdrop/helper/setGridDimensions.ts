import { RefObject } from 'react';
import { Grid } from '../types';

export const setGridDimensions = (gridRef: RefObject<Grid>) => {
  const maxSquareDimensions = 120;
  const squareSize = Math.min(window.innerWidth / 8, maxSquareDimensions);

  const cols = window.innerWidth / squareSize + 1;
  const rows = window.innerHeight / squareSize + 1;

  const offset = -squareSize / 2;

  const offsetX = offset;

  const offsetY = offset;

  gridRef.current = { squareSize, cols, rows, offsetX, offsetY };
};
