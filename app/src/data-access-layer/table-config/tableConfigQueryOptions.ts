import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/tableConfigService';
import { tableConfigKeys } from './tableConfigKeys';

export const tableConfigListQueryOptions = () =>
  queryOptions({
    queryKey: tableConfigKeys.all(),
    queryFn: service.getAllTableConfigs,
    throwOnError: true,
  });
