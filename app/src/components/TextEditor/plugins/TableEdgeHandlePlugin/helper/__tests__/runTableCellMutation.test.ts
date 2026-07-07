import { describe, it, expect, vi, afterEach } from 'vitest';
import type { LexicalEditor } from 'lexical';
import type { TableObserver } from '@lexical/table';
import { runTableCellMutation } from '../runTableCellMutation';

vi.mock('@lexical/table', () => ({
  getTableObserverFromTableElement: vi.fn(),
}));

import { getTableObserverFromTableElement } from '@lexical/table';

const makeEditor = (): LexicalEditor =>
  ({
    update: (fn: () => void) => {
      fn();
    },
  }) as unknown as LexicalEditor;

describe('runTableCellMutation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call mutate when the table observer cannot be resolved', () => {
    vi.mocked(getTableObserverFromTableElement).mockReturnValue(null);
    const mutate = vi.fn();

    runTableCellMutation(
      makeEditor(),
      0,
      0,
      document.createElement('table'),
      mutate,
    );

    expect(mutate).not.toHaveBeenCalled();
  });

  it('does not call mutate when the target cell node cannot be found', () => {
    const getCellNodeFromCords = vi.fn().mockReturnValue(null);
    vi.mocked(getTableObserverFromTableElement).mockReturnValue({
      $lookup: () => ({ tableNode: { getCellNodeFromCords } }),
      getTable: () => ({ rows: 1, columns: 1, domRows: [] }),
    } as unknown as TableObserver);
    const mutate = vi.fn();

    runTableCellMutation(
      makeEditor(),
      0,
      0,
      document.createElement('table'),
      mutate,
    );

    expect(mutate).not.toHaveBeenCalled();
  });

  it('selects the cell and calls mutate on the happy path', () => {
    const selectStart = vi.fn();
    const cellNode = { selectStart };
    const getCellNodeFromCords = vi.fn().mockReturnValue(cellNode);
    vi.mocked(getTableObserverFromTableElement).mockReturnValue({
      $lookup: () => ({ tableNode: { getCellNodeFromCords } }),
      getTable: () => ({ rows: 1, columns: 1, domRows: [] }),
    } as unknown as TableObserver);
    const mutate = vi.fn();

    runTableCellMutation(
      makeEditor(),
      1,
      2,
      document.createElement('table'),
      mutate,
    );

    expect(getCellNodeFromCords).toHaveBeenCalledWith(
      1,
      2,
      expect.objectContaining({ rows: 1, columns: 1 }),
    );
    expect(selectStart).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalled();
  });
});
