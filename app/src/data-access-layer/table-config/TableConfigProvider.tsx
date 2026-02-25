import { createContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableConfig, UpdateTableConfigInput } from '@db/table-config';
import * as service from '@/services/tableConfigService';
import { SortDirection } from '@db/table-config/layout-schema';

type TableConfigContextType = {
  tableConfigs: TableConfig[];
  loading: boolean;
  getConfigForTable: (tableName: string) => TableConfig;
  updateTableConfig: (
    id: string,
    data: UpdateTableConfigInput,
  ) => Promise<void>;
  updateColumnWidths: (
    tableName: string,
    widths: Record<string, number>,
  ) => Promise<void>;
  updateSortState: (
    tableName: string,
    column: string,
    direction: SortDirection,
  ) => Promise<void>;
};

export const TableConfigContext = createContext<TableConfigContextType | null>(
  null,
);

type TableConfigProviderProps = {
  children: ReactNode;
};

export const TableConfigProvider = ({ children }: TableConfigProviderProps) => {
  const queryClient = useQueryClient();

  const { data: tableConfigs = [], isPending: isLoadingConfigs } = useQuery({
    queryKey: ['tableConfig'],
    queryFn: service.getAllTableConfigs,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableConfigInput }) =>
      service.updateTableConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableConfig'] });
    },
  });

  const getConfigForTable = (tableName: string): TableConfig => {
    const config = tableConfigs.find((c) => c.table_name === tableName);
    if (!config) throw new Error(`No table config found for "${tableName}"`);
    return config;
  };

  const handleUpdateTableConfig = async (
    id: string,
    data: UpdateTableConfigInput,
  ): Promise<void> => {
    await updateMutation.mutateAsync({ id, data });
  };

  const updateColumnWidths = async (
    tableName: string,
    widths: Record<string, number>,
  ): Promise<void> => {
    const config = getConfigForTable(tableName);
    const updatedColumns = config.layout.columns.map((col) => ({
      ...col,
      width: widths[col.key] ?? col.width,
    }));
    await updateMutation.mutateAsync({
      id: config.id,
      data: { layout: { ...config.layout, columns: updatedColumns } },
    });
  };

  const updateSortState = async (
    tableName: string,
    column: string,
    direction: SortDirection,
  ): Promise<void> => {
    const config = getConfigForTable(tableName);
    await updateMutation.mutateAsync({
      id: config.id,
      data: { layout: { ...config.layout, sort_state: { column, direction } } },
    });
  };

  const value: TableConfigContextType = {
    tableConfigs,
    loading: isLoadingConfigs,
    getConfigForTable,
    updateTableConfig: handleUpdateTableConfig,
    updateColumnWidths,
    updateSortState,
  };

  return (
    <TableConfigContext.Provider value={value}>
      {children}
    </TableConfigContext.Provider>
  );
};
