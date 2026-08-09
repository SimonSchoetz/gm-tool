import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/foesService';
import { foeKeys } from './foeKeys';

export const foeListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: foeKeys.list(adventureId),
    queryFn: () => service.getAllFoes(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const foeQueryOptions = (foeId: string) =>
  queryOptions({
    queryKey: foeKeys.detail(foeId),
    queryFn: () => service.getFoeById(foeId),
    enabled: !!foeId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
