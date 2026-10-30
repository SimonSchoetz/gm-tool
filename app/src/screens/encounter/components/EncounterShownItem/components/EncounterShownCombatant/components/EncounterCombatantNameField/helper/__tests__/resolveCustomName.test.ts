import { describe, expect, it } from 'vitest';
import { resolveCustomName } from '../resolveCustomName';

describe('resolveCustomName', () => {
  it('trims surrounding spaces off a typed name', () => {
    expect(resolveCustomName('  Boss ', 'Goblin 3')).toBe('Boss');
  });

  it.each([
    ['empty', ''],
    ['spaces-only', '   '],
  ])('returns null for an %s name', (_label, typed) => {
    expect(resolveCustomName(typed, 'Goblin 3')).toBeNull();
  });

  it('returns null for exactly the automatic name, also with surrounding spaces', () => {
    expect(resolveCustomName('Goblin 3', 'Goblin 3')).toBeNull();
    expect(resolveCustomName(' Goblin 3 ', 'Goblin 3')).toBeNull();
  });

  it('keeps any other name, including one that only contains the automatic name', () => {
    expect(resolveCustomName('Goblin 3b', 'Goblin 3')).toBe('Goblin 3b');
  });
});
