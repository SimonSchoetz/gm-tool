import { useMemo } from 'react';
import { useTableConfig } from '@/providers/table-config';
import {
  parseLayout,
  type TableLayout,
  type SortDirection,
} from '@/domain/table-config';

export const useTableLayout = (tableName: string) => {
  const { getConfigForTable, updateTableConfig } = useTableConfig();

  const config = getConfigForTable(tableName);
  const layoutJson = config?.layout;
  const layout = useMemo(() => parseLayout(layoutJson), [layoutJson]);

  const updateLayout = async (partialLayout: Partial<TableLayout>) => {
    if (!config) return;
    const updatedLayout = { ...layout, ...partialLayout };
    await updateTableConfig(config.id, {
      layout: JSON.stringify(updatedLayout),
    });
  };

  const updateColumnWidths = async (widths: Record<string, number>) => {
    const updatedColumns = layout.columns.map((col) => ({
      ...col,
      width: widths[col.key] ?? col.width,
    }));
    await updateLayout({ columns: updatedColumns });
  };

  const updateSortState = async (
    column: string,
    direction: SortDirection,
  ) => {
    await updateLayout({ sort_state: { column, direction } });
  };

  return {
    columns: layout.columns,
    sortState: layout.sort_state,
    searchableColumns: layout.searchable_columns,
    updateColumnWidths,
    updateSortState,
  };
};
