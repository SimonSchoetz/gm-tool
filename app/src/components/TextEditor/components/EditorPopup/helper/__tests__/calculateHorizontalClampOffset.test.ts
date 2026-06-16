import { describe, it, expect } from 'vitest';
import { calculateHorizontalClampOffset } from '../calculateHorizontalClampOffset';

describe('calculateHorizontalClampOffset', () => {
  it('returns 0 when the popup fits within the viewport with no overflow', () => {
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 500,
        popupWidth: 200,
        viewportWidth: 1000,
        edgePadding: 12,
      }),
    ).toBe(0);
  });

  it('returns a positive offset when the popup would overflow the left edge', () => {
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 50,
        popupWidth: 200,
        viewportWidth: 1000,
        edgePadding: 12,
      }),
    ).toBe(62);
    // leftEdge = 50 - 100 = -50; offset = 12 - (-50) = 62
  });

  it('returns a negative offset when the popup would overflow the right edge', () => {
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 950,
        popupWidth: 200,
        viewportWidth: 1000,
        edgePadding: 12,
      }),
    ).toBe(-62);
    // rightEdge = 950 + 100 = 1050; offset = (1000 - 12) - 1050 = -62
  });

  it('returns 0 exactly at the edge padding boundary', () => {
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 112,
        popupWidth: 200,
        viewportWidth: 1000,
        edgePadding: 12,
      }),
    ).toBe(0);
    // leftEdge = 112 - 100 = 12, equal to edgePadding - not < edgePadding
  });
});
