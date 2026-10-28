import { describe, it, expect } from 'vitest';
import { reorderIds } from '../reorderIds';

describe('reorderIds', () => {
  it('moves the dragged id to the position of the id it was dropped on, moving down', () => {
    expect(reorderIds(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('moves the dragged id to the position of the id it was dropped on, moving up', () => {
    expect(reorderIds(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
  });

  it('swaps two neighbours', () => {
    expect(reorderIds(['a', 'b', 'c'], 'b', 'c')).toEqual(['a', 'c', 'b']);
  });

  it('does not change the list it was given', () => {
    const ids = ['a', 'b', 'c'];

    reorderIds(ids, 'a', 'c');

    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
