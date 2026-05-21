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
});
