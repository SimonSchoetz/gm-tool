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
