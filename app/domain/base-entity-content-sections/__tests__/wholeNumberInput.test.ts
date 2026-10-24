import { describe, it, expect } from 'vitest';
import { parseWholeNumberInput } from '../wholeNumberInput';

describe('parseWholeNumberInput', () => {
  it.each(['', '   '])(
    'reads blank input %j as a valid empty value instead of 0',
    (raw) => {
      expect(parseWholeNumberInput(raw)).toEqual({ valid: true, value: null });
    },
  );

  it('accepts a negative whole number', () => {
    expect(parseWholeNumberInput('-3')).toEqual({ valid: true, value: -3 });
  });

  it.each(['1.5', 'abc'])('rejects %j instead of truncating it', (raw) => {
    expect(parseWholeNumberInput(raw)).toEqual({ valid: false });
  });

  it('rejects a 20-digit string whose value is beyond the safe integer range', () => {
    expect(parseWholeNumberInput('12345678901234567890')).toEqual({
      valid: false,
    });
  });
});
