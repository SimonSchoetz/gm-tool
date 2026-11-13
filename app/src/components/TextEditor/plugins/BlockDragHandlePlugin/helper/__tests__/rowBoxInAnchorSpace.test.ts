import { describe, expect, it } from 'vitest';
import { rowBoxInAnchorSpace } from '../rowBoxInAnchorSpace';

describe('rowBoxInAnchorSpace', () => {
  it('gives the row’s top and marker column edge relative to the anchor and its height from its own top and bottom', () => {
    const anchorRect = { left: 30, top: 100 };
    const row = { markerLeft: 80, top: 140, bottom: 175 };

    expect(rowBoxInAnchorSpace(anchorRect, row)).toEqual({
      top: row.top - anchorRect.top,
      left: row.markerLeft - anchorRect.left,
      height: row.bottom - row.top,
    });
  });
});
