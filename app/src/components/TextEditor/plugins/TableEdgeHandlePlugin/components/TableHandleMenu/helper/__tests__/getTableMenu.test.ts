import { describe, expect, it } from 'vitest';
import { getTableMenu } from '../getTableMenu';

describe('getTableMenu', () => {
  it('wires each row menu action to the row mutation its label names', () => {
    const { toggleHeaderLabel, actions } = getTableMenu('row');

    expect(toggleHeaderLabel).toMatch(/header row/i);
    expect(actions.map(({ label, mutation }) => [label, mutation])).toEqual([
      ['Insert above', 'insertRowAbove'],
      ['Insert below', 'insertRowBelow'],
      ['Delete row', 'deleteRow'],
    ]);
  });

  it('wires each column menu action to the column mutation its label names', () => {
    const { toggleHeaderLabel, actions } = getTableMenu('column');

    expect(toggleHeaderLabel).toMatch(/header column/i);
    expect(actions.map(({ label, mutation }) => [label, mutation])).toEqual([
      ['Insert left', 'insertColumnLeft'],
      ['Insert right', 'insertColumnRight'],
      ['Delete column', 'deleteColumn'],
    ]);
  });
});
