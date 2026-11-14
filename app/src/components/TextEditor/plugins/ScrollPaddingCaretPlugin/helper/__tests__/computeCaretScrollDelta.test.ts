import { describe, it, expect } from 'vitest';
import { computeCaretScrollDelta } from '../computeCaretScrollDelta';

const SCROLLER = { top: 100, bottom: 300 };

describe('computeCaretScrollDelta', () => {
  it('scrolls up by the shortfall when the caret sits above the padded range', () => {
    const caret = { top: 110, bottom: 130 };
    const paddingTop = 24;

    expect(computeCaretScrollDelta(caret, SCROLLER, paddingTop, 24)).toBe(
      caret.top - (SCROLLER.top + paddingTop),
    );
  });

  it('scrolls down by the overshoot when the caret sits below the padded range', () => {
    const caret = { top: 260, bottom: 285 };
    const paddingBottom = 24;

    expect(computeCaretScrollDelta(caret, SCROLLER, 24, paddingBottom)).toBe(
      caret.bottom - (SCROLLER.bottom - paddingBottom),
    );
  });

  it('does not scroll a caret that is inside the padded range', () => {
    expect(
      computeCaretScrollDelta({ top: 150, bottom: 170 }, SCROLLER, 24, 24),
    ).toBe(0);
  });

  it('does not scroll a caret that touches the padded range edges', () => {
    const paddingTop = 24;
    const paddingBottom = 30;
    const atTop = { top: SCROLLER.top + paddingTop, bottom: 140 };
    const atBottom = { top: 240, bottom: SCROLLER.bottom - paddingBottom };

    expect(
      computeCaretScrollDelta(atTop, SCROLLER, paddingTop, paddingBottom),
    ).toBe(0);
    expect(
      computeCaretScrollDelta(atBottom, SCROLLER, paddingTop, paddingBottom),
    ).toBe(0);
  });

  it('does not scroll for a caret rect of no height, which is an unmeasured empty line', () => {
    expect(
      computeCaretScrollDelta({ top: 0, bottom: 0 }, SCROLLER, 24, 24),
    ).toBe(0);
  });

  it('keeps the caret top at the range top when the range is shorter than the caret', () => {
    const paddingTop = 80;
    const paddingBottom = 80;
    const caret = { top: 190, bottom: 250 };
    const rangeTop = SCROLLER.top + paddingTop;

    expect(
      computeCaretScrollDelta(caret, SCROLLER, paddingTop, paddingBottom),
    ).toBe(caret.top - rangeTop);
  });

  it('applies the top and the bottom padding to their own edge', () => {
    const caretNearTop = { top: 120, bottom: 140 };
    const caretNearBottom = { top: 270, bottom: 290 };

    expect(computeCaretScrollDelta(caretNearTop, SCROLLER, 10, 60)).toBe(0);
    expect(computeCaretScrollDelta(caretNearBottom, SCROLLER, 10, 60)).toBe(
      caretNearBottom.bottom - (SCROLLER.bottom - 60),
    );
    expect(computeCaretScrollDelta(caretNearTop, SCROLLER, 60, 10)).toBe(
      caretNearTop.top - (SCROLLER.top + 60),
    );
    expect(computeCaretScrollDelta(caretNearBottom, SCROLLER, 60, 10)).toBe(0);
  });
});
