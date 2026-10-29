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
  isWriting: boolean;
  recordLogEntry: <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ) => Promise<boolean>;
  deleteLogMessage: (entryId: string) => Promise<boolean>;
};

export const useEncounterLogEntries = (
  encounterId: string,
): UseEncounterLogEntriesReturn => {
  const queryClient = useQueryClient();

  const { data: logEntries = [], isPending: loading } = useQuery(
    encounterLogEntriesQueryOptions(encounterId),
  );

  // One key for the record and the delete mutation, so the pending flag and the call-time refusal cover every write.
  const writeMutationKey = encounterKeys.writeLogEntry(encounterId);

  // The invalidation promise is returned, so the mutation stays pending until the refetch has resolved: with `void` the buttons would re-enable while the queue still shows the old HP, and a second click would act on stale numbers.
  const invalidateLogEntries = () =>
    queryClient.invalidateQueries({
      queryKey: encounterKeys.logEntries(encounterId),
    });

  const recordMutation = useMutation({
    mutationKey: writeMutationKey,
    mutationFn: ({
      kind,
      payload,
    }: {
      kind: LogEntryKind;
      payload: LogEntryPayload<LogEntryKind>;
    }) => service.recordLogEntry(encounterId, kind, payload),
    onSuccess: invalidateLogEntries,
  });

  const deleteMutation = useMutation({
    mutationKey: writeMutationKey,
    mutationFn: (entryId: string) => service.deleteLogMessage(entryId),
    onSuccess: invalidateLogEntries,
  });

  // Read from the mutation cache, not from a mutation: a hook-local isPending belongs to one hook instance, so a sibling's buttons would stay enabled. The guard reads the cache at call time because a useIsMutating value read from render state lags the call by a render, so two calls in one call stack would both write.
  const isWriting = useIsMutating({ mutationKey: writeMutationKey }) > 0;
  const hasPendingWrite = () =>
    queryClient.isMutating({ mutationKey: writeMutationKey }) > 0;

  const recordLogEntry = async <K extends LogEntryKind>(
    kind: K,
    payload: LogEntryPayload<K>,
  ): Promise<boolean> => {
    if (hasPendingWrite()) {
      return false;
    }
    await recordMutation.mutateAsync({ kind, payload });
    return true;
  };

  const deleteLogMessage = async (entryId: string): Promise<boolean> => {
    if (hasPendingWrite()) {
      return false;
    }
    await deleteMutation.mutateAsync(entryId);
    return true;
  };

  return {
    logEntries,
    loading,
    isWriting,
    recordLogEntry,
    deleteLogMessage,
  };
};
