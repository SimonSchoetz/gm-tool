import { describe, it, expect, afterEach } from 'vitest';
import { setGridDimensions } from '../setGridDimensions';
import type { Grid } from '../../types';

const makeGridRef = (): { current: Grid } => ({ current: null });

const setWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
    writable: true,
  });
};

describe('setGridDimensions', () => {
  afterEach(() => {
    setWindowSize(1024, 768);
  });

  it('sets squareSize to innerWidth / 8 when that is below 120', () => {
    setWindowSize(800, 600);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current).toEqual({
      squareSize: 100,
      cols: 9,
      rows: 7,
      offsetX: -50,
      offsetY: -50,
    });
  });

  it('caps squareSize at 120 when innerWidth / 8 exceeds 120', () => {
    setWindowSize(1200, 900);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current).toEqual({
      squareSize: 120,
      cols: 11,
      rows: 8.5,
      offsetX: -60,
      offsetY: -60,
    });
  });

  it('sets offsetX and offsetY to -squareSize / 2', () => {
    setWindowSize(640, 480);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    const squareSize = gridRef.current?.squareSize ?? 0;
    expect(squareSize).toBeGreaterThan(0);
    expect(gridRef.current?.offsetX).toBe(-squareSize / 2);
    expect(gridRef.current?.offsetY).toBe(-squareSize / 2);
  });
});
