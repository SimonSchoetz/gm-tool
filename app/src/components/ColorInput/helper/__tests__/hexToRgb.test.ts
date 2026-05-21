import { describe, expect, it } from 'vitest';
import { hexToRgb } from '../hexToRgb';

describe('hexToRgb', () => {
  it('converts #4a9eff to 74, 158, 255', () => {
    expect(hexToRgb('#4a9eff')).toBe('74, 158, 255');
  });

  it('converts #000000 to 0, 0, 0', () => {
    expect(hexToRgb('#000000')).toBe('0, 0, 0');
  });

  it('converts #ffffff to 255, 255, 255', () => {
    expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
  });

  it('converts #ff6b6b to 255, 107, 107', () => {
    expect(hexToRgb('#ff6b6b')).toBe('255, 107, 107');
  });
});
