import { describe, expect, it } from 'vitest';
import { getTooltipsButtonLabel } from '../getTooltipsButtonLabel';

describe('getTooltipsButtonLabel', () => {
  it('offers to hide the tooltips while they are visible', () => {
    expect(getTooltipsButtonLabel(true)).toBe('Hide tooltips');
  });

  it('offers to show the tooltips while they are hidden', () => {
    expect(getTooltipsButtonLabel(false)).toBe('Show tooltips');
  });
});
