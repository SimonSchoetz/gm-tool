import { describe, expect, it } from 'vitest';
import { rgbToHex } from '../rgbToHex';

describe('rgbToHex', () => {
  it('converts 74, 158, 255 to #4a9eff', () => {
    expect(rgbToHex('74, 158, 255')).toBe('#4a9eff');
  });

  it('converts 0, 0, 0 to #000000', () => {
    expect(rgbToHex('0, 0, 0')).toBe('#000000');
  });

  it('converts 255, 255, 255 to #ffffff', () => {
    expect(rgbToHex('255, 255, 255')).toBe('#ffffff');
  });

  it('converts 255, 107, 107 to #ff6b6b', () => {
    expect(rgbToHex('255, 107, 107')).toBe('#ff6b6b');
  });

  it('returns #000000 for an empty string', () => {
    expect(rgbToHex('')).toBe('#000000');
  });

  it('returns #000000 for a non-rgb string like a hex value', () => {
    expect(rgbToHex('#f8ffff')).toBe('#000000');
  });

  it.each([
    ['four components', '1, 2, 3, 4'],
    ['two components', '1, 2'],
    ['a first component that is no number', 'x, 2, 3'],
    ['a second component that is no number', '1, x, 3'],
    ['a third component that is no number', '1, 2, x'],
  ])('returns #000000 for %s', (_name, rgb) => {
    expect(rgbToHex(rgb)).toBe('#000000');
  });
});
