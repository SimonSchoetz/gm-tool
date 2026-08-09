import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/itemsService';
import { itemKeys } from './itemKeys';

export const itemListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: itemKeys.list(adventureId),
    queryFn: () => service.getAllItems(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const itemQueryOptions = (itemId: string) =>
  queryOptions({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => service.getItemById(itemId),
    enabled: !!itemId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
