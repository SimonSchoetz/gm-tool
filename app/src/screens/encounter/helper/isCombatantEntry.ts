import type { CombatantEntry, EventEntry } from './buildQueueEntries';

export const isCombatantEntry = (
  entry: CombatantEntry | EventEntry | null,
): entry is CombatantEntry => entry?.kind === 'combatant';
