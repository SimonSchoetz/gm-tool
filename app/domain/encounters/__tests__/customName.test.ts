import { describe, expect, it } from 'vitest';
import { normalizeCustomName } from '../customName';

describe('normalizeCustomName', () => {
  it('gives null for no name', () => {
    expect(normalizeCustomName(null)).toBeNull();
  });

  it.each([
    ['empty', ''],
    ['spaces-only', '   '],
  ])('gives null for an %s name', (_label, raw) => {
    expect(normalizeCustomName(raw)).toBeNull();
  });

  it('trims surrounding spaces and keeps interior ones', () => {
    expect(normalizeCustomName('  Big  Boss ')).toBe('Big  Boss');
  });
});
