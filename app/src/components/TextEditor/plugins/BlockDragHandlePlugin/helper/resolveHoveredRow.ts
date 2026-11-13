import type { BlockRow } from './collectBlockRows';

// A row's band runs from the middle of the gap above it to the middle of the gap below it, so the pointer crossing a margin between two rows always belongs to one of them. The first row's band starts at its own top and the last row's ends at its own bottom, so a pointer above or below the content belongs to no row.
export const resolveHoveredRow = (
  rows: readonly BlockRow[],
  clientY: number,
): BlockRow | null =>
  rows.find((row, index) => {
    const rowAbove = index === 0 ? null : (rows.at(index - 1) ?? null);
    const rowBelow = rows.at(index + 1) ?? null;
    const bandTop =
      rowAbove === null ? row.top : (rowAbove.bottom + row.top) / 2;
    const bandBottom =
      rowBelow === null ? row.bottom : (row.bottom + rowBelow.top) / 2;
    return clientY >= bandTop && clientY <= bandBottom;
  }) ?? null;
