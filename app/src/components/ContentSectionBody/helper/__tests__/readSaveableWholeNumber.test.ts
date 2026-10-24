import { describe, it, expect } from 'vitest';
import { readSaveableWholeNumber } from '../readSaveableWholeNumber';

describe('readSaveableWholeNumber', () => {
  it('reads unconvertible text, which the input reports as an empty value, as unsaveable instead of a cleared value', () => {
    expect(
      readSaveableWholeNumber({ value: '', validity: { badInput: true } }),
    ).toEqual({ valid: false });
  });

  it('reads a deliberately cleared field as a saveable empty value', () => {
    expect(
      readSaveableWholeNumber({ value: '', validity: { badInput: false } }),
    ).toEqual({ valid: true, value: null });
  });

  it('rejects a decimal the input can convert, since only whole numbers are saveable', () => {
    expect(
      readSaveableWholeNumber({ value: '1.5', validity: { badInput: false } }),
    ).toEqual({ valid: false });
  });
});
