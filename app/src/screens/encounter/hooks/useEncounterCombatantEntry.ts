import type { CombatantEntry } from '../helper/buildQueueEntries';
import { isCombatantEntry } from '../helper/isCombatantEntry';
import { useEncounterQueueEntry } from './useEncounterQueueEntry';

export const useEncounterCombatantEntry = (
  queueItemId: string,
): CombatantEntry | null => {
  const entry = useEncounterQueueEntry(queueItemId);
  return isCombatantEntry(entry) ? entry : null;
};
