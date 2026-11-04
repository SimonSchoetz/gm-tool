import { describe, expect, it } from 'vitest';
import { parseNonNegativeWholeNumber } from '../nonNegativeWholeNumber';

describe('parseNonNegativeWholeNumber', () => {
  it.each([
    ['0', 0],
    ['2', 2],
    ['1e9', 1e9],
  ])('accepts %j at or above 0', (raw, value) => {
    expect(parseNonNegativeWholeNumber(raw)).toEqual({ valid: true, value });
  });

  it('rejects a number below 0', () => {
    expect(parseNonNegativeWholeNumber('-1')).toEqual({ valid: false });
  });

  it.each(['', '   '])('reads %j as an empty field', (raw) => {
    expect(parseNonNegativeWholeNumber(raw)).toEqual({
      valid: true,
      value: null,
    });
  });

  it.each(['abc', '1.5'])('rejects %j as not a whole number', (raw) => {
    expect(parseNonNegativeWholeNumber(raw)).toEqual({ valid: false });
  });
});
