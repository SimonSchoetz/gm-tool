import { describe, expect, it } from 'vitest';
import { parseWholeNumberInRange } from '../wholeNumberInRange';

describe('parseWholeNumberInRange', () => {
  it.each([
    ['1', 1],
    ['2', 2],
    ['1e9', 1e9],
  ])('accepts %j at or above the minimum', (raw, value) => {
    expect(parseWholeNumberInRange(raw, 1)).toEqual({ valid: true, value });
  });

  it('rejects a number below the minimum', () => {
    expect(parseWholeNumberInRange('0', 1)).toEqual({ valid: false });
  });

  it.each(['', '   '])(
    'reads %j as an empty field, even when the minimum is above 0',
    (raw) => {
      expect(parseWholeNumberInRange(raw, 1)).toEqual({
        valid: true,
        value: null,
      });
    },
  );

  it.each(['abc', '1.5'])('rejects %j as not a whole number', (raw) => {
    expect(parseWholeNumberInRange(raw, 0)).toEqual({ valid: false });
  });
});
