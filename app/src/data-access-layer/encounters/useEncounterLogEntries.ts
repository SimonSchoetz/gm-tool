import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { LogEntryKind, LogEntryPayload } from '@domain/encounters';
import * as service from '@services/encounterLogEntryService';
import { encounterKeys } from './encounterKeys';
import { encounterLogEntriesQueryOptions } from './encounterQueryOptions';

type UseEncounterLogEntriesReturn = {
  logEntries: EncounterLogEntry[];
  loading: boolean;
  isRecording: boolean;
  recordLogEntry: <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ) => Promise<boolean>;
};

export const useEncounterLogEntries = (
  encounterId: string,
): UseEncounterLogEntriesReturn => {
  const queryClient = useQueryClient();

  const { data: logEntries = [], isPending: loading } = useQuery(
    encounterLogEntriesQueryOptions(encounterId),
  );

  const recordMutation = useMutation({
    mutationKey: encounterKeys.recordLogEntry(encounterId),
    mutationFn: ({
      kind,
      payload,
    }: {
      kind: LogEntryKind;
      payload: LogEntryPayload<LogEntryKind>;
    }) => service.recordLogEntry(encounterId, kind, payload),
    // The invalidation promise is returned, so the mutation stays pending until the refetch has resolved: with `void` the buttons would re-enable while the queue still shows the old HP, and a second click would act on stale numbers.
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: encounterKeys.logEntries(encounterId),
      }),
  });

  // Read from the mutation cache, not from recordMutation: a hook-local isPending belongs to one hook instance, so a sibling's buttons would stay enabled. The guard in recordLogEntry reads the cache at call time because a useIsMutating value read from render state lags the call by a render, so two calls in one call stack would both write.
  const isRecording =
    useIsMutating({ mutationKey: encounterKeys.recordLogEntry(encounterId) }) >
    0;

  const recordLogEntry = async <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ): Promise<boolean> => {
    if (
      queryClient.isMutating({
        mutationKey: encounterKeys.recordLogEntry(encounterId),
      }) > 0
    ) {
      return false;
    }
    await recordMutation.mutateAsync({ kind, payload });
    return true;
  };

  return { logEntries, loading, isRecording, recordLogEntry };
};
