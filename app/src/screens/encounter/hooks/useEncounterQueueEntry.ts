import { useEncounterQueueEntries } from './useEncounterQueueEntries';

type QueueEntry = ReturnType<
  typeof useEncounterQueueEntries
>['entries'][number];

export const useEncounterQueueEntry = (
  queueItemId: string,
): QueueEntry | null => {
  const { entries } = useEncounterQueueEntries();
  return entries.find((entry) => entry.id === queueItemId) ?? null;
};
