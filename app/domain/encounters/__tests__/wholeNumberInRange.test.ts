import { describe, expect, it } from 'vitest';
import { parseWholeNumberInRange } from '../wholeNumberInRange';

describe('parseWholeNumberInRange', () => {
  it.each([
    ['2', 2],
    ['1', 1],
    ['5', 5],
  ])('accepts %j inside the range, both bounds included', (raw, value) => {
    expect(parseWholeNumberInRange(raw, 1, 5)).toEqual({ valid: true, value });
  });

  it.each(['0', '6'])('rejects %j outside the range', (raw) => {
    expect(parseWholeNumberInRange(raw, 1, 5)).toEqual({ valid: false });
  });

  it('has no ceiling when no maximum is given', () => {
    expect(parseWholeNumberInRange('1e9', 0)).toEqual({
      valid: true,
      value: 1e9,
    });
  });

  it.each(['', '   '])(
    'reads %j as an empty field, even when the minimum is above 0',
    (raw) => {
      expect(parseWholeNumberInRange(raw, 1, 5)).toEqual({
        valid: true,
        value: null,
      });
    },
  );

  it.each(['abc', '1.5'])('rejects %j as not a whole number', (raw) => {
    expect(parseWholeNumberInRange(raw, 0)).toEqual({ valid: false });
  });
});
