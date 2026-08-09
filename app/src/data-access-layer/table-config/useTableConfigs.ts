import { useQuery } from '@tanstack/react-query';
import type { TableConfig } from '@db/table-config';
import { tableConfigListQueryOptions } from './tableConfigQueryOptions';

type UseTableConfigsReturn = {
  tableConfigs: TableConfig[];
  loading: boolean;
};

export const useTableConfigs = (): UseTableConfigsReturn => {
  const { data: tableConfigs = [], isPending: loading } = useQuery(
    tableConfigListQueryOptions(),
  );

  return { tableConfigs, loading };
};
