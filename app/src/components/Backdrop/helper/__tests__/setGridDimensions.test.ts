import { describe, it, expect, afterEach } from 'vitest';
import { setGridDimensions } from '../setGridDimensions';
import type { Grid } from '../../types/grid.type';

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

  it('always sets squareSize to 120', () => {
    setWindowSize(800, 600);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current?.squareSize).toBe(120);
  });

  it('sets cols to innerWidth / 120 + 1', () => {
    setWindowSize(1200, 900);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current?.cols).toBe(1200 / 120 + 1);
  });

  it('sets rows to innerHeight / 120 + 1', () => {
    setWindowSize(1200, 900);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current?.rows).toBe(900 / 120 + 1);
  });
});

describe('setGridDimensions offsets', () => {
  afterEach(() => {
    setWindowSize(1024, 768);
  });

  it('shifts the grid left and up by half a square on both axes', () => {
    setWindowSize(1200, 900);
    const gridRef = makeGridRef();
    setGridDimensions(gridRef);
    expect(gridRef.current?.offsetX).toBe(
      -(gridRef.current?.squareSize ?? 0) / 2,
    );
    expect(gridRef.current?.offsetY).toBe(
      -(gridRef.current?.squareSize ?? 0) / 2,
    );
  });
});
