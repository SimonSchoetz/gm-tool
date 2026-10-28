import { describe, it, expect } from 'vitest';
import { parseAddQuantity } from '../addQuantity';

describe('parseAddQuantity', () => {
  it.each([
    ['1', 1],
    ['99', 99],
  ])(
    'accepts %j at the edge of the range and returns the number',
    (raw, expected) => {
      expect(parseAddQuantity(raw)).toBe(expected);
    },
  );

  it.each(['0', '100', '', '1.5', 'abc', '-1'])(
    'rejects %j with null',
    (raw) => {
      expect(parseAddQuantity(raw)).toBeNull();
    },
  );
});
