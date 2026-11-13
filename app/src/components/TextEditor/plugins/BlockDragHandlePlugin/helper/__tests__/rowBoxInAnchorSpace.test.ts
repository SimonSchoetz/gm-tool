import { describe, expect, it } from 'vitest';
import { rowBoxInAnchorSpace } from '../rowBoxInAnchorSpace';

describe('rowBoxInAnchorSpace', () => {
  it('gives the row’s top and marker column edge relative to the anchor, its height from its own top and bottom and its unit’s height down to the unit’s bottom', () => {
    const anchorRect = { left: 30, top: 100 };
    const row = { markerLeft: 80, top: 140, bottom: 175, unitBottom: 230 };

    expect(rowBoxInAnchorSpace(anchorRect, row)).toEqual({
      top: row.top - anchorRect.top,
      left: row.markerLeft - anchorRect.left,
      height: row.bottom - row.top,
      unitHeight: row.unitBottom - row.top,
    });
  });
});
