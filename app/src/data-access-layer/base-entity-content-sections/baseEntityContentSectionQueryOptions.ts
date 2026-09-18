import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/baseEntityContentSectionService';
import { baseEntityContentSectionKeys } from './baseEntityContentSectionKeys';

export const baseEntityContentSectionListQueryOptions = (
  baseEntityId: string,
) =>
  queryOptions({
    queryKey: baseEntityContentSectionKeys.list(baseEntityId),
    queryFn: () => service.getSectionsByBaseEntityId(baseEntityId),
    enabled: !!baseEntityId,
    throwOnError: true,
  });
