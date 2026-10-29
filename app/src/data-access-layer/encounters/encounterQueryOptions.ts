import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/encounterService';
import * as queueService from '@services/encounterQueueService';
import * as logEntryService from '@services/encounterLogEntryService';
import { encounterKeys } from './encounterKeys';

export const encounterListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: encounterKeys.list(adventureId),
    queryFn: () => service.getAllEncounters(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const encounterQueryOptions = (encounterId: string) =>
  queryOptions({
    queryKey: encounterKeys.detail(encounterId),
    queryFn: () => service.getEncounterById(encounterId),
    enabled: !!encounterId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

export const encounterQueueItemsQueryOptions = (encounterId: string) =>
  queryOptions({
    queryKey: encounterKeys.queueItems(encounterId),
    queryFn: () => queueService.getQueueItems(encounterId),
    enabled: !!encounterId,
    throwOnError: true,
  });

export const encounterLogEntriesQueryOptions = (encounterId: string) =>
  queryOptions({
    queryKey: encounterKeys.logEntries(encounterId),
    queryFn: () => logEntryService.getLogEntries(encounterId),
    enabled: !!encounterId,
    throwOnError: true,
  });
