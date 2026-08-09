import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/npcsService';
import { npcKeys } from './npcKeys';

export const npcListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: npcKeys.list(adventureId),
    queryFn: () => service.getAllNpcs(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const npcQueryOptions = (npcId: string) =>
  queryOptions({
    queryKey: npcKeys.detail(npcId),
    queryFn: () => service.getNpcById(npcId),
    enabled: !!npcId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
