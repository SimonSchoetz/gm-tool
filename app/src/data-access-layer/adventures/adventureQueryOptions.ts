import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/adventureService';
import { adventureKeys } from './adventureKeys';

export const adventureListQueryOptions = () =>
  queryOptions({
    queryKey: adventureKeys.list(),
    queryFn: service.getAllAdventures,
    throwOnError: true,
  });

export const adventureQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: adventureKeys.detail(adventureId),
    queryFn: () => service.getAdventureById(adventureId),
    enabled: !!adventureId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
