import { describe, expect, it } from 'vitest';
import { getBgImageOffset } from '../getBgImageOffset';

describe('getBgImageOffset', () => {
  it('is 0 before the image has loaded', () => {
    expect(getBgImageOffset(false, 100, 0)).toBe(0);
  });

  it('is half the overflow at 0%, 0 at 50% and minus half at 100%', () => {
    expect(getBgImageOffset(true, 100, 0)).toBe(50);
    expect(getBgImageOffset(true, 100, 50)).toBe(0);
    expect(getBgImageOffset(true, 100, 100)).toBe(-50);
  });
});
