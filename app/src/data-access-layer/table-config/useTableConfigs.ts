import { useQuery } from '@tanstack/react-query';
import type { TableConfig } from '@db/table-config';
import * as service from '@/services/tableConfigService';
import { tableConfigKeys } from './tableConfigKeys';

type UseTableConfigsReturn = {
  tableConfigs: TableConfig[];
  loading: boolean;
};

export const useTableConfigs = (): UseTableConfigsReturn => {
  const { data: tableConfigs = [], isPending: loading } = useQuery({
    queryKey: tableConfigKeys.all(),
    queryFn: service.getAllTableConfigs,
    throwOnError: true,
  });

  return { tableConfigs, loading };
};
