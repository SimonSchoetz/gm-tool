import type { BlockRow } from './collectBlockRows';
import type { DropPlacement } from './moveBlock';
import { resolveHoveredRow } from './resolveHoveredRow';

export type DropTarget = {
  row: BlockRow;
  placement: DropPlacement;
  // The row whose margin opens the gap the drop line sits in, and which of its margins: the row above the gap, or the first row's top margin when the gap is the start of the document.
  gap: { row: BlockRow; margin: 'marginTop' | 'marginBottom' };
  // The middle of the gap, in client coordinates.
  lineTop: number;
};

// The half rule: the pointer in the upper half of the row under it chooses the gap before that row, the lower half the gap after it. A pointer above the first row or below the last chooses that row.
export const resolveDropTarget = (
  rows: readonly BlockRow[],
  clientY: number,
): DropTarget | null => {
  const first = rows.at(0) ?? null;
  const last = rows.at(-1) ?? null;
  const row =
    resolveHoveredRow(rows, clientY) ??
    (first !== null && clientY < first.top ? first : last);
  if (row === null) return null;
  const index = rows.indexOf(row);
  const rowAbove = index === 0 ? null : (rows.at(index - 1) ?? null);
  const rowBelow = rows.at(index + 1) ?? null;

  if (clientY < (row.top + row.bottom) / 2) {
    return rowAbove === null
      ? {
          row,
          placement: 'before',
          gap: { row, margin: 'marginTop' },
          lineTop: row.top - row.marginTop / 2,
        }
      : {
          row,
          placement: 'before',
          gap: { row: rowAbove, margin: 'marginBottom' },
          lineTop: (rowAbove.bottom + row.top) / 2,
        };
  }
  return {
    row,
    placement: 'after',
    gap: { row, margin: 'marginBottom' },
    lineTop:
      rowBelow === null
        ? row.bottom + row.marginBottom / 2
        : (row.bottom + rowBelow.top) / 2,
  };
};
