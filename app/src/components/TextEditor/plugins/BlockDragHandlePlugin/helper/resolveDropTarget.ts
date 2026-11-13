import type { NodeKey } from 'lexical';
import type { BlockRow } from './collectBlockRows';
import type { DropPlacement } from './moveBlock';
import { resolveHoveredRow } from './resolveHoveredRow';

export type DropTarget = {
  // The row under the pointer, which the drop highlight marks.
  row: BlockRow;
  // The row the move is placed beside, which is not `row` for the lower half of an open toggle's header (the first row of its body) and for a pointer leaving a toggle body (the toggle).
  beside: BlockRow;
  placement: DropPlacement;
  // The row whose margin opens the gap the drop line sits in, and which of its margins: the top margin of the row the move is placed before, the bottom margin of the row it is placed after.
  gap: { row: BlockRow; margin: 'marginTop' | 'marginBottom' };
  // Where the drop line starts, in client coordinates: the middle of the gap, at the left edge of the row the move is placed beside.
  lineTop: number;
  lineLeft: number;
};

// Whether the row is the last one in its toggle body, or in the root: the next row, past this row's own body, is in a shallower container or there is none.
const isLastInContainer = (
  rows: readonly BlockRow[],
  row: BlockRow,
): boolean => {
  const next =
    rows
      .slice(rows.indexOf(row) + 1)
      .find((candidate) => candidate.ancestry.length <= row.ancestry.length) ??
    null;
  return next === null || next.ancestry.length < row.ancestry.length;
};

// The position after a row that is the last of its toggle body moves outward, one toggle at a time while that toggle is itself last in its container, for each level the pointer is left of the left edge of the row it is currently placed after.
const rowToPlaceAfter = (
  rows: readonly BlockRow[],
  row: BlockRow,
  clientX: number,
): BlockRow => {
  // A root row has no host: no row's key equals the missing last key of its empty ancestry.
  const host =
    rows.find((candidate) => candidate.key === row.ancestry.at(-1)) ?? null;
  return host !== null && clientX < row.left && isLastInContainer(rows, row)
    ? rowToPlaceAfter(rows, host, clientX)
    : row;
};

type Position = { beside: BlockRow; placement: DropPlacement };

// Where in the row under the pointer a drop lands: before the row's unit for the upper half; for the lower half the first row of an open toggle's body (none for the toggle being dragged, whose body is its own subtree), and otherwise after the row's unit, or after a toggle the row ends the body of.
const choosePosition = (
  rows: readonly BlockRow[],
  row: BlockRow,
  draggedKey: NodeKey,
  clientX: number,
  clientY: number,
): Position | null => {
  if (clientY < (row.top + row.bottom) / 2) {
    return { beside: row, placement: 'before' };
  }
  const bodyStart = rows.at(rows.indexOf(row) + 1) ?? null;
  if (bodyStart !== null && bodyStart.ancestry.at(-1) === row.key) {
    return row.key === draggedKey
      ? null
      : { beside: bodyStart, placement: 'before' };
  }
  return { beside: rowToPlaceAfter(rows, row, clientX), placement: 'after' };
};

// The half rule: the pointer in the upper half of the row under it chooses the gap before that row's unit, the lower half the gap after it. A pointer above the first row or below the last chooses that row. The lower half of an open toggle's header chooses the gap before the first row of its body, and the lower half of the last row of a toggle body leaves the toggle by the pointer's horizontal position. A row inside the dragged block's own subtree, and the lower half of the dragged toggle's header when its body is open, offer no position.
export const resolveDropTarget = (
  rows: readonly BlockRow[],
  draggedKey: NodeKey,
  clientX: number,
  clientY: number,
): DropTarget | null => {
  const first = rows.at(0) ?? null;
  const last = rows.at(-1) ?? null;
  const row =
    resolveHoveredRow(rows, clientY) ??
    (first !== null && clientY < first.top ? first : last);
  if (row === null || row.ancestry.includes(draggedKey)) return null;

  const position = choosePosition(rows, row, draggedKey, clientX, clientY);
  if (position === null) return null;
  const { beside, placement } = position;
  return placement === 'before'
    ? {
        row,
        beside,
        placement,
        gap: { row: beside, margin: 'marginTop' },
        lineTop: beside.top - beside.marginTop / 2,
        lineLeft: beside.left,
      }
    : {
        row,
        beside,
        placement,
        gap: { row: beside, margin: 'marginBottom' },
        lineTop: beside.unitBottom + beside.marginBottom / 2,
        lineLeft: beside.left,
      };
};
