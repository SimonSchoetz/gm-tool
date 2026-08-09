import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/sessionService';
import { sessionKeys } from './sessionKeys';

export const sessionListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: sessionKeys.list(adventureId),
    queryFn: () => service.getAllSessions(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const sessionQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => service.getSessionById(sessionId),
    enabled: !!sessionId,
    throwOnError: true,
  });
