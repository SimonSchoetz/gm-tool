import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/sessionStepService';
import { sessionStepKeys } from './sessionStepKeys';

export const sessionStepListQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: sessionStepKeys.list(sessionId),
    queryFn: () => service.getStepsBySessionId(sessionId),
    enabled: !!sessionId,
    throwOnError: true,
  });
