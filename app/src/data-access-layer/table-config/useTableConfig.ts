import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TableConfig, UpdateTableConfigInput } from '@db/table-config';
import type { SortDirection } from '@db/table-config/layout-schema';
import * as service from '@/services/tableConfigService';
import { tableConfigKeys } from './tableConfigKeys';

type UseTableConfigReturn = {
  config: TableConfig | undefined;
  loading: boolean;
  updateTableConfig: (data: UpdateTableConfigInput) => Promise<void>;
  updateColumnWidths: (widths: Record<string, number>) => Promise<void>;
  updateSortState: (column: string, direction: SortDirection) => Promise<void>;
};

export const useTableConfig = (tableId: string): UseTableConfigReturn => {
  const queryClient = useQueryClient();

  const { data: config, isPending: loading } = useQuery({
    queryKey: tableConfigKeys.detail(tableId),
    queryFn: () => service.getTableConfigById(tableId),
    enabled: !!tableId,
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableConfigInput }) =>
      service.updateTableConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableConfigKeys.all() });
      queryClient.invalidateQueries({
        queryKey: tableConfigKeys.detail(tableId),
      });
    },
  });

  const updateTableConfig = async (
    data: UpdateTableConfigInput,
  ): Promise<void> => {
    if (!config) return;
    await updateMutation.mutateAsync({ id: config.id, data });
  };

  const updateColumnWidths = async (
    widths: Record<string, number>,
  ): Promise<void> => {
    if (!config) return;
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
    column: string,
    direction: SortDirection,
  ): Promise<void> => {
    if (!config) return;
    await updateMutation.mutateAsync({
      id: config.id,
      data: { layout: { ...config.layout, sort_state: { column, direction } } },
    });
  };

  return {
    config,
    loading,
    updateTableConfig,
    updateColumnWidths,
    updateSortState,
  };
};
