import { describe, it, expect } from 'vitest';
import { calculateVerticalPlacement } from '../calculateVerticalPlacement';

describe('calculateVerticalPlacement', () => {
  it('returns "above" when the popup fits above the anchor with no overflow', () => {
    expect(
      calculateVerticalPlacement({
        anchorTop: 500,
        popupHeight: 200,
        edgePadding: 12,
      }),
    ).toBe('above');
  });

  it('returns "below" when the popup would overflow the top edge', () => {
    expect(
      calculateVerticalPlacement({
        anchorTop: 100,
        popupHeight: 200,
        edgePadding: 12,
      }),
    ).toBe('below');
    // above-space = 100 - 200 = -100, less than edgePadding
  });

  it('returns "above" exactly at the edge padding boundary', () => {
    expect(
      calculateVerticalPlacement({
        anchorTop: 212,
        popupHeight: 200,
        edgePadding: 12,
      }),
    ).toBe('above');
    // above-space = 212 - 200 = 12, equal to edgePadding - not < edgePadding
  });
});
