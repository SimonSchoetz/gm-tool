import type {
  CombatantEntry,
  EventEntry,
} from '../../../../../helper/buildQueueEntries';
import { describeQueueEntryHp } from '../../../../../helper/describeQueueEntryHp';
import { parseActionAmount } from '@domain';
import type { PlanRow } from './planGroupAction';

export const buildPlanRows = (
  entries: (CombatantEntry | EventEntry)[],
  amountTextOf: (id: string) => string,
): PlanRow[] =>
  entries.map((entry): PlanRow => {
    if (entry.kind === 'event') {
      return { kind: 'event', id: entry.id };
    }
    return {
      kind: 'combatant',
      id: entry.id,
      amount: parseActionAmount(amountTextOf(entry.id)),
      hasHp: describeQueueEntryHp(entry) !== null,
      defeated: entry.defeated,
    };
  });
