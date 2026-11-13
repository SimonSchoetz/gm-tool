import type { BlockRow } from './collectBlockRows';

// The rows whose handles show while `hovered` is hovered: the rows of the units that enclose it, outermost first, then the hovered row itself, so every parent block can be grabbed from its innermost child. A key of the hovered row's ancestry that names no row among `rows` is skipped.
export const handleRowsOf = (
  rows: readonly BlockRow[],
  hovered: BlockRow,
): BlockRow[] => {
  const enclosingRows = hovered.ancestry.flatMap((key) => {
    const row = rows.find((candidate) => candidate.key === key) ?? null;
    return row === null ? [] : [row];
  });
  return [...enclosingRows, hovered];
};
