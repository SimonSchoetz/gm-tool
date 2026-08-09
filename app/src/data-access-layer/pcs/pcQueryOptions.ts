import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/pcsService';
import { pcKeys } from './pcKeys';

export const pcListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: pcKeys.list(adventureId),
    queryFn: () => service.getAllPcs(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const pcQueryOptions = (pcId: string) =>
  queryOptions({
    queryKey: pcKeys.detail(pcId),
    queryFn: () => service.getPcById(pcId),
    enabled: !!pcId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
