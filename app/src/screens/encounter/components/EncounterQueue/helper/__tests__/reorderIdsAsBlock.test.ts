import { describe, expect, it } from 'vitest';
import { reorderIds } from '@/util/reorderIds';
import { reorderIdsAsBlock } from '../reorderIdsAsBlock';

const LIST = ['A', 'B', 'C', 'D', 'E', 'F'];
const BLOCK = ['B', 'D', 'E'];

describe('reorderIdsAsBlock', () => {
  it('lands a block moved down directly after the dropped-on id, in list order', () => {
    expect(reorderIdsAsBlock(LIST, BLOCK, 'D', 'F')).toEqual([
      'A',
      'C',
      'F',
      'B',
      'D',
      'E',
    ]);
  });

  it('lands a block moved up directly before the dropped-on id, in list order', () => {
    expect(reorderIdsAsBlock(LIST, BLOCK, 'E', 'A')).toEqual([
      'B',
      'D',
      'E',
      'A',
      'C',
      'F',
    ]);
  });

  it('orders the block as the list does whatever order the block ids come in', () => {
    expect(reorderIdsAsBlock(LIST, ['E', 'B', 'D'], 'D', 'F')).toEqual([
      'A',
      'C',
      'F',
      'B',
      'D',
      'E',
    ]);
  });

  it('makes a block with non-adjacent members adjacent', () => {
    const result = reorderIdsAsBlock(LIST, ['A', 'F'], 'A', 'C');

    expect(result).toEqual(['B', 'C', 'A', 'F', 'D', 'E']);
  });

  it('keeps ids outside the block in their order relative to the ids that did not move', () => {
    const withHidden = ['A', 'hidden-1', 'B', 'C', 'hidden-2', 'D'];

    const result = reorderIdsAsBlock(withHidden, ['A', 'B'], 'A', 'D');

    expect(result).toEqual(['hidden-1', 'C', 'hidden-2', 'D', 'A', 'B']);
  });

  it('equals reorderIds for a block of one', () => {
    expect(reorderIdsAsBlock(LIST, ['B'], 'B', 'E')).toEqual(
      reorderIds(LIST, 'B', 'E'),
    );
    expect(reorderIdsAsBlock(LIST, ['E'], 'E', 'B')).toEqual(
      reorderIds(LIST, 'E', 'B'),
    );
  });
});
