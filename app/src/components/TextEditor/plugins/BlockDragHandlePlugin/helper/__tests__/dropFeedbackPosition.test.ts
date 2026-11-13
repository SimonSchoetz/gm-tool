import { describe, expect, it } from 'vitest';
import { dropFeedbackPosition } from '../dropFeedbackPosition';
import { rowBoxInAnchorSpace } from '../rowBoxInAnchorSpace';
import { makeRow } from './support/blockRows';

describe('dropFeedbackPosition', () => {
  it('gives the line its target position relative to the anchor and the highlight the box the hovered row has', () => {
    const anchorRect = { left: 30, top: 100 };
    const row = makeRow('r', { top: 140, bottom: 175, left: 90 });
    const target = { row, lineLeft: 120, lineTop: 190 };
    const box = rowBoxInAnchorSpace(anchorRect, row);

    expect(dropFeedbackPosition(anchorRect, target)).toEqual({
      lineTop: target.lineTop - anchorRect.top,
      lineLeft: target.lineLeft - anchorRect.left,
      highlightTop: box.top,
      highlightLeft: box.left,
      highlightHeight: box.height,
    });
  });
});
