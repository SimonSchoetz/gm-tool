import { DEFAULT_COLUMN_WIDTH } from '../SortableList.constants';

export const buildGridTemplate = (
  columnKeys: string[],
  widths: Record<string, number>,
): string => {
  const lastIndex = columnKeys.length - 1;
  return columnKeys
    .map((key, index) => {
      const width = widths[key] ?? DEFAULT_COLUMN_WIDTH;
      return index === lastIndex ? `minmax(${width}px, 1fr)` : `${width}px`;
    })
    .join(' ');
};
