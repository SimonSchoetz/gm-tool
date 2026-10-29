import { useQuery } from '@tanstack/react-query';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import { encounterLogEntriesQueryOptions } from './encounterQueryOptions';

type UseEncounterLogEntriesReturn = {
  logEntries: EncounterLogEntry[];
  loading: boolean;
};

export const useEncounterLogEntries = (
  encounterId: string,
): UseEncounterLogEntriesReturn => {
  const { data: logEntries = [], isPending: loading } = useQuery(
    encounterLogEntriesQueryOptions(encounterId),
  );

  return { logEntries, loading };
};
