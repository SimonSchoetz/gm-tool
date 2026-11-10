import { buildGridTemplate } from '../../../helper/buildGridTemplate';

export const buildItemGridTemplate = (
  columns: { key: string; width: number }[],
  dragWidths: Record<string, number> | null,
): string => {
  const keys = columns.map((column) => column.key);
  const widths =
    dragWidths ??
    Object.fromEntries(columns.map((column) => [column.key, column.width]));
  return buildGridTemplate(keys, widths);
};
