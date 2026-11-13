import { describe, expect, it } from 'vitest';
import { handleRowsOf } from '../handleRowsOf';
import { makeRow } from './support/blockRows';

const toggle = makeRow('toggle', { top: 0, bottom: 20 });
const item = makeRow('item', {
  top: 24,
  bottom: 44,
  ancestry: ['toggle'],
});
const subItem = makeRow('subItem', {
  top: 48,
  bottom: 68,
  ancestry: ['toggle', 'item'],
});
const outsider = makeRow('outsider', { top: 72, bottom: 92 });
const rows = [toggle, item, subItem, outsider];

describe('handleRowsOf', () => {
  it('gives the enclosing rows outermost first and the hovered row last', () => {
    expect(handleRowsOf(rows, subItem).map((row) => row.key)).toEqual([
      'toggle',
      'item',
      'subItem',
    ]);
  });

  it('gives only the hovered row for a row that no unit encloses', () => {
    expect(handleRowsOf(rows, outsider).map((row) => row.key)).toEqual([
      'outsider',
    ]);
  });

  it('skips an ancestry key that names no row', () => {
    const orphan = makeRow('orphan', {
      top: 0,
      bottom: 20,
      ancestry: ['missing', 'toggle'],
    });

    expect(handleRowsOf(rows, orphan).map((row) => row.key)).toEqual([
      'toggle',
      'orphan',
    ]);
  });
});
