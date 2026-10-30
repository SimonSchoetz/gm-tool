import { describe, it, expect } from 'vitest';
import { getIdAfterRemoval } from '../getIdAfterRemoval';

const ids = ['a', 'b', 'c', 'd', 'e'];

describe('getIdAfterRemoval', () => {
  it('returns the id directly below a removed middle id', () => {
    expect(getIdAfterRemoval(ids, 'c')).toBe('d');
  });

  it('returns the id directly above a removed last id', () => {
    expect(getIdAfterRemoval(ids, 'e')).toBe('d');
  });

  it('returns null when the only id is removed', () => {
    expect(getIdAfterRemoval(['a'], 'a')).toBeNull();
  });

  it('returns null for an id not in the list', () => {
    expect(getIdAfterRemoval(ids, 'x')).toBeNull();
  });
});
