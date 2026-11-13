import { describe, expect, it } from 'vitest';
import { makeItemRow, makeRow } from '../blockRows';

describe('blockRows', () => {
  it('makes a root paragraph’s row from the geometry given, with the rest defaulted', () => {
    const row = makeRow('p', { top: 5, bottom: 25, left: 40, marginBottom: 2 });

    expect(row).toMatchObject({
      key: 'p',
      top: 5,
      bottom: 25,
      unitBottom: 25,
      left: 40,
      markerLeft: 40,
      marginTop: 0,
      marginBottom: 2,
      ancestry: [],
      canJoinList: true,
      list: null,
    });
    expect(row.endElement).toBe(row.element);
  });

  it('makes a list item’s row whose text sits one step more right per depth and whose marker column is one step left of its text', () => {
    const item = makeItemRow(
      'i',
      { top: 0, bottom: 20 },
      { depth: 2, rootKey: 'L', parents: ['a', 'b'] },
      ['T'],
    );

    expect(item.left).toBe(16 + 24 * 3);
    expect(item.markerLeft).toBe(item.left - 24);
    expect(item.ancestry).toEqual(['T', 'a', 'b']);
    expect(item.list).toMatchObject({ depth: 2, step: 24, rootKey: 'L' });
  });
});
