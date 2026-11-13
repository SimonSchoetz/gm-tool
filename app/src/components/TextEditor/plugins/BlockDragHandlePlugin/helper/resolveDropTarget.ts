import type { NodeKey } from 'lexical';
import type { BlockRow, DropPlacement, ListRowInfo } from './collectBlockRows';
import { resolveHoveredRow } from './resolveHoveredRow';

export type DropTarget = {
  // The row under the pointer, which the drop highlight marks.
  row: BlockRow;
  // The node the move is placed beside, which is not `row` for a drop on the lower half of a row with rows inside it, a pointer leaving a container, and a position before or after a whole list.
  besideKey: NodeKey;
  placement: DropPlacement;
  // The list depth the dropped unit lands at, or null where it lands outside every list.
  depth: number | null;
  // The element whose margin opens the gap the drop line sits in, and which of its margins.
  gap: { element: HTMLElement; margin: 'marginTop' | 'marginBottom' };
  // Where the drop line starts, in client coordinates: the middle of the gap, at the left edge of the text the dropped unit would have.
  lineTop: number;
  lineLeft: number;
};

// The edge of a unit a drop is placed beside: the element whose margin opens the gap, which margin, where that unit's edge is and how large the margin is now.
type GapEdge = {
  element: HTMLElement;
  margin: 'marginTop' | 'marginBottom';
  y: number;
  size: number;
};

// One position a gap offers. The pointer chooses it when its horizontal position is at or right of `threshold`, the left edge of the text the unit would have there.
type Landing = {
  besideKey: NodeKey;
  placement: DropPlacement;
  depth: number | null;
  threshold: number;
  lineLeft: number;
  edge: GapEdge;
  // The units the landing lies inside, outermost first.
  enclosing: readonly NodeKey[];
};

// The threshold of a landing that has no horizontal condition: where it is the only position of its gap.
const ALWAYS = Number.NEGATIVE_INFINITY;

const landingBefore = (row: BlockRow, threshold: number): Landing => ({
  besideKey: row.key,
  placement: 'before',
  depth: row.list?.depth ?? null,
  threshold,
  lineLeft: row.left,
  edge: {
    element: row.element,
    margin: 'marginTop',
    y: row.top,
    size: row.marginTop,
  },
  enclosing: row.ancestry,
});

const landingAfter = (row: BlockRow): Landing => ({
  besideKey: row.key,
  placement: 'after',
  depth: row.list?.depth ?? null,
  threshold: row.left,
  lineLeft: row.left,
  edge: {
    element: row.endElement,
    margin: 'marginBottom',
    y: row.unitBottom,
    size: row.marginBottom,
  },
  enclosing: row.ancestry,
});

// The first child of a list item that has no sub-items: one level deeper, its text one step right of the item's.
const landingFirstChild = (row: BlockRow, list: ListRowInfo): Landing => ({
  ...landingAfter(row),
  depth: list.depth + 1,
  threshold: row.left + list.step,
  lineLeft: row.left + list.step,
  enclosing: [...row.ancestry, row.key],
});

// Beside a whole list, outside every list: before it from its first item, after it from its last depth-0 item. The text a paragraph would have there starts where the list's own edge is, one step left of the item's text.
const landingBesideList = (
  row: BlockRow,
  list: ListRowInfo,
  placement: DropPlacement,
): Landing => ({
  besideKey: list.rootKey,
  placement,
  depth: null,
  threshold: row.left - list.step,
  lineLeft: row.left - list.step,
  edge:
    placement === 'before'
      ? {
          element: list.rootElement,
          margin: 'marginTop',
          y: row.top,
          size: list.rootMarginTop,
        }
      : {
          element: list.rootElement,
          margin: 'marginBottom',
          y: row.unitBottom,
          size: list.rootMarginBottom,
        },
  enclosing: row.ancestry,
});

// The row, then the rows of the units it ends the container of, outward while they are deeper than `floor`, the nesting of the row below the gap.
const outwardFrom = (
  rows: readonly BlockRow[],
  row: BlockRow,
  floor: number,
): BlockRow[] => {
  const host =
    row.ancestry.length > floor
      ? (rows.find((candidate) => candidate.key === row.ancestry.at(-1)) ??
        null)
      : null;
  return host === null ? [row] : [row, ...outwardFrom(rows, host, floor)];
};

// The position before `below` when it is the first item of a list that `above` is not in: inside the list, at the text of a depth-0 item. An item with a depth is never first, since the row above it is in its list.
const listStartLandings = (above: BlockRow, below: BlockRow): Landing[] =>
  below.list !== null && above.list?.rootKey !== below.list.rootKey
    ? [landingBefore(below, below.left)]
    : [];

// The positions of the gap below `above` and above `below`. Below an item with no sub-items: its first child, then after it and after each unit it ends, down to the nesting of `below`; below the last item of a list that `below` is not in: after the list; above the first item of a list that `above` is not in: before that item.
const positionsOfGap = (
  rows: readonly BlockRow[],
  above: BlockRow,
  below: BlockRow | null,
): Landing[] => {
  if (below !== null && below.ancestry.at(-1) === above.key) {
    return [landingBefore(below, ALWAYS)];
  }
  const outward = outwardFrom(rows, above, below?.ancestry.length ?? 0);
  const belowList = below?.list ?? null;
  return [
    ...(above.list === null ? [] : [landingFirstChild(above, above.list)]),
    ...outward.map(landingAfter),
    ...outward.flatMap((row) =>
      row.list !== null &&
      row.list.depth === 0 &&
      belowList?.rootKey !== row.list.rootKey
        ? [landingBesideList(row, row.list, 'after')]
        : [],
    ),
    ...(below === null ? [] : listStartLandings(above, below)),
  ];
};

// The positions of the gap above a row: the gap's own when the rows on either side are items of one list, so the pointer chooses a depth; otherwise only the position before the row, which for the first item of a list is before the item, inside the list, or before the list.
const positionsAbove = (
  rows: readonly BlockRow[],
  above: BlockRow | null,
  below: BlockRow,
): Landing[] => {
  const belowList = below.list;
  if (
    above !== null &&
    above.list !== null &&
    above.list.rootKey === belowList?.rootKey
  ) {
    return positionsOfGap(rows, above, below);
  }
  if (belowList !== null) {
    return [
      landingBefore(below, below.left),
      landingBesideList(below, belowList, 'before'),
    ];
  }
  return [landingBefore(below, ALWAYS)];
};

// The half rule: the pointer in the upper half of the row under it chooses the gap above that row, the lower half the gap below it; a pointer above the first row or below the last chooses that row. The pointer's horizontal position chooses among the positions of that gap. A row inside the dragged block's own subtree, and every position inside it, offer nothing, and only a paragraph or a list item is offered a position inside a list.
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

  const index = rows.indexOf(row);
  const positions =
    clientY < (row.top + row.bottom) / 2
      ? positionsAbove(
          rows,
          index === 0 ? null : (rows.at(index - 1) ?? null),
          row,
        )
      : positionsOfGap(rows, row, rows.at(index + 1) ?? null);
  const canJoinList =
    rows.find((candidate) => candidate.key === draggedKey)?.canJoinList ??
    false;
  const offered = positions
    .filter(
      (position) =>
        !position.enclosing.includes(draggedKey) &&
        (position.depth === null || canJoinList),
    )
    .sort((left, right) => right.threshold - left.threshold);
  const chosen =
    offered.find((position) => clientX >= position.threshold) ??
    offered.at(-1) ??
    null;
  if (chosen === null) return null;

  const { edge } = chosen;
  return {
    row,
    besideKey: chosen.besideKey,
    placement: chosen.placement,
    depth: chosen.depth,
    gap: { element: edge.element, margin: edge.margin },
    lineTop:
      edge.margin === 'marginTop'
        ? edge.y - edge.size / 2
        : edge.y + edge.size / 2,
    lineLeft: chosen.lineLeft,
  };
};
