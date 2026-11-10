import type { TableConfig } from '@db/table-config';

export const getTableColor = (
  tableConfigs: Pick<TableConfig, 'table_name' | 'color'>[],
  tableName: string,
): string => {
  const table =
    tableConfigs.find((config) => config.table_name === tableName) ?? null;
  return table?.color ?? '';
};
