import type { CombatantEntry, EventEntry } from './buildQueueEntries';

export const isEventEntry = (
  entry: CombatantEntry | EventEntry | null,
): entry is EventEntry => entry?.kind === 'event';
