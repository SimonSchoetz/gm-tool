import { describe, it, expect } from 'vitest';
import { readSaveableHp } from '../readSaveableHp';

describe('readSaveableHp', () => {
  it('reads unconvertible text, which the input reports as an empty value, as unsaveable instead of a cleared HP', () => {
    expect(readSaveableHp({ value: '', validity: { badInput: true } })).toEqual(
      { valid: false },
    );
  });

  it('reads a deliberately cleared field as a saveable empty HP', () => {
    expect(
      readSaveableHp({ value: '', validity: { badInput: false } }),
    ).toEqual({ valid: true, hp: null });
  });

  it('rejects a decimal the input can convert, since only whole numbers are saveable', () => {
    expect(
      readSaveableHp({ value: '1.5', validity: { badInput: false } }),
    ).toEqual({ valid: false });
  });
});
