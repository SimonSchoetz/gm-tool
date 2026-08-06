import { describe, it, expect } from 'vitest';
import { isItemPinned } from '../isItemPinned';

describe('isItemPinned', () => {
  it('returns true for a numeric pinned_order', () => {
    expect(isItemPinned({ pinned_order: 3 })).toBe(true);
  });

  it('returns false for a null pinned_order', () => {
    expect(isItemPinned({ pinned_order: null })).toBe(false);
  });

  it('returns false when the pinned_order key is absent', () => {
    expect(isItemPinned({})).toBe(false);
  });

  it('returns true for a zero pinned_order', () => {
    expect(isItemPinned({ pinned_order: 0 })).toBe(true);
  });
});
