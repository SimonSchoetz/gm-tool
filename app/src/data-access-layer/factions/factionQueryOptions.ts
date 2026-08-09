import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/factionsService';
import { factionKeys } from './factionKeys';

export const factionListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: factionKeys.list(adventureId),
    queryFn: () => service.getAllFactions(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const factionQueryOptions = (factionId: string) =>
  queryOptions({
    queryKey: factionKeys.detail(factionId),
    queryFn: () => service.getFactionById(factionId),
    enabled: !!factionId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
