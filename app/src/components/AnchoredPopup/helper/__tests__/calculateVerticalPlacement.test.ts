import { describe, it, expect } from 'vitest';
import { calculateVerticalPlacement } from '../calculateVerticalPlacement';
import { EDGE_PADDING } from '../AnchoredPopup.constants';

describe('calculateVerticalPlacement', () => {
  it('returns "above" when the popup fits above the anchor with no overflow', () => {
    expect(
      calculateVerticalPlacement({
        anchorTop: 500,
        popupHeight: 200,
      }),
    ).toBe('above');
  });

  it('returns "below" when the popup would overflow the top edge', () => {
    // above-space = 100 - 200 = -100, less than EDGE_PADDING
    expect(
      calculateVerticalPlacement({
        anchorTop: 100,
        popupHeight: 200,
      }),
    ).toBe('below');
  });

  it('returns "above" exactly at the edge padding boundary', () => {
    // above-space = EDGE_PADDING, equal to it - not < it
    expect(
      calculateVerticalPlacement({
        anchorTop: 200 + EDGE_PADDING,
        popupHeight: 200,
      }),
    ).toBe('above');
  });
});
