import { describe, it, expect } from 'vitest';
import { isPrimaryButtonDown } from '../isPrimaryButtonDown';

describe('isPrimaryButtonDown', () => {
  it.each([1, 3])('reads %i as the primary button held', (buttons) => {
    expect(isPrimaryButtonDown(buttons)).toBe(true);
  });

  it.each([0, 2, 4])('reads %i as the primary button not held', (buttons) => {
    expect(isPrimaryButtonDown(buttons)).toBe(false);
  });
});
