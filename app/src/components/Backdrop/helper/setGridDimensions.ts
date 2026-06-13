import { RefObject } from 'react';
import { Grid } from '../types';

export const setGridDimensions = (gridRef: RefObject<Grid>) => {
  const squareSize = 120;

  const cols = window.innerWidth / squareSize + 1;
  const rows = window.innerHeight / squareSize + 1;

  const offsetX = -squareSize / 2;
  const offsetY = -squareSize / 2;

  gridRef.current = { squareSize, cols, rows, offsetX, offsetY };
};
