import { describe, it, expect } from 'vitest';
import { MIN_ZOOM } from '../../ImagePreviewFramingOverlay.constants';
import { clampFrame } from '../clampFrame';

describe('clampFrame', () => {
  it('clamps x below 0 to 0', () => {
    expect(clampFrame({ x: -10, y: 50, zoom: 1 }, 5).x).toBe(0);
  });

  it('clamps x above 100 to 100', () => {
    expect(clampFrame({ x: 110, y: 50, zoom: 1 }, 5).x).toBe(100);
  });

  it('clamps y below 0 to 0', () => {
    expect(clampFrame({ x: 50, y: -5, zoom: 1 }, 5).y).toBe(0);
  });

  it('clamps y above 100 to 100', () => {
    expect(clampFrame({ x: 50, y: 200, zoom: 1 }, 5).y).toBe(100);
  });

  it('clamps zoom below the minimum to the minimum', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: MIN_ZOOM / 2 }, 5).zoom).toBe(
      MIN_ZOOM,
    );
  });

  it('clamps zoom above maxZoom to maxZoom', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: 10 }, 5).zoom).toBe(5);
  });

  it('returns valid values within range unchanged', () => {
    expect(clampFrame({ x: 40, y: 60, zoom: 2 }, 5)).toEqual({
      x: 40,
      y: 60,
      zoom: 2,
    });
  });

  it('returns the minimum zoom unchanged', () => {
    expect(clampFrame({ x: 50, y: 50, zoom: MIN_ZOOM }, 5)).toEqual({
      x: 50,
      y: 50,
      zoom: MIN_ZOOM,
    });
  });
});
