import { describe, it, expect } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM } from '../../ImagePreviewFramingOverlay.constants';
import { clampFrame } from '../clampFrame';

describe('clampFrame', () => {
  it('clamps x below 0 to 0', () => {
    expect(clampFrame({ x: -10, y: 50, zoom: 1 }).x).toBe(0);
  });

  it('clamps x above 100 to 100', () => {
    expect(clampFrame({ x: 110, y: 50, zoom: 1 }).x).toBe(100);
  });

  it('clamps y below 0 to 0', () => {
    expect(clampFrame({ x: 50, y: -5, zoom: 1 }).y).toBe(0);
  });

  it('clamps y above 100 to 100', () => {
    expect(clampFrame({ x: 50, y: 200, zoom: 1 }).y).toBe(100);
  });

  it('clamps zoom below the minimum to the minimum', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: MIN_ZOOM / 2 }).zoom).toBe(
      MIN_ZOOM,
    );
  });

  it('clamps zoom above the maximum to the maximum', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: MAX_ZOOM * 2 }).zoom).toBe(
      MAX_ZOOM,
    );
  });

  it('returns valid values within range unchanged', () => {
    expect(clampFrame({ x: 40, y: 60, zoom: 2 })).toEqual({
      x: 40,
      y: 60,
      zoom: 2,
    });
  });

  it('returns the minimum zoom unchanged', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: MIN_ZOOM })).toEqual({
      x: 50,
      y: 50,
      zoom: MIN_ZOOM,
    });
  });
});
