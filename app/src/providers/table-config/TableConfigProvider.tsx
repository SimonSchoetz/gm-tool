import { createContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableConfig, UpdateTableConfigInput } from '@db/table-config';
import * as service from '@/services/tableConfigService';

type TableConfigContextType = {
  tableConfigs: TableConfig[];
  loading: boolean;
  getConfigForTable: (tableName: string) => TableConfig | null;
  updateTableConfig: (id: string, data: UpdateTableConfigInput) => Promise<void>;
};

export const TableConfigContext = createContext<TableConfigContextType | null>(
  null
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

  const getConfigForTable = (tableName: string): TableConfig | null => {
    return tableConfigs.find((config) => config.table_name === tableName) ?? null;
  };

  const handleUpdateTableConfig = async (
    id: string,
    data: UpdateTableConfigInput
  ): Promise<void> => {
    await updateMutation.mutateAsync({ id, data });
  };

  const value: TableConfigContextType = {
    tableConfigs,
    loading: isLoadingConfigs,
    getConfigForTable,
    updateTableConfig: handleUpdateTableConfig,
  };

  return (
    <TableConfigContext.Provider value={value}>
      {children}
    </TableConfigContext.Provider>
  );
};
