import { describe, it, expect } from 'vitest';
import { calculateHorizontalClampOffset } from '../calculateHorizontalClampOffset';
import { EDGE_PADDING } from '../AnchoredPopup.constants';

describe('calculateHorizontalClampOffset', () => {
  it('returns 0 when the popup fits within the viewport with no overflow', () => {
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 500,
        popupWidth: 200,
        viewportWidth: 1000,
      }),
    ).toBe(0);
  });

  it('returns a positive offset when the popup would overflow the left edge', () => {
    // leftEdge = 50 - 100 = -50; offset = EDGE_PADDING - (-50)
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 50,
        popupWidth: 200,
        viewportWidth: 1000,
      }),
    ).toBe(EDGE_PADDING + 50);
  });

  it('returns a negative offset when the popup would overflow the right edge', () => {
    // rightEdge = 950 + 100 = 1050; offset = (1000 - EDGE_PADDING) - 1050
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 950,
        popupWidth: 200,
        viewportWidth: 1000,
      }),
    ).toBe(1000 - EDGE_PADDING - 1050);
  });

  it('returns 0 exactly at the edge padding boundary', () => {
    // leftEdge = EDGE_PADDING, equal to the padding - not < it
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 100 + EDGE_PADDING,
        popupWidth: 200,
        viewportWidth: 1000,
      }),
    ).toBe(0);
  });
  it('clamps a popup whose right edge reaches into the padding but stays inside the viewport', () => {
    // rightEdge = 900 + 100 = 1000, inside the viewport but past 1000 - EDGE_PADDING
    expect(
      calculateHorizontalClampOffset({
        anchorCenterX: 900,
        popupWidth: 200,
        viewportWidth: 1000,
      }),
    ).toBe(-EDGE_PADDING);
  });
});
