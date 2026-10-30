import { describe, expect, it } from 'vitest';
import type {
  CombatantEntry,
  EventEntry,
} from '../../../../../../helper/buildQueueEntries';
import { buildPlanRows } from '../buildPlanRows';

const combatant = (
  id: string,
  overrides: Partial<CombatantEntry> = {},
): CombatantEntry => ({
  kind: 'combatant',
  id,
  name: id,
  automaticName: id,
  entity: null,
  imageId: null,
  maxHp: 10,
  currentHp: 10,
  tempHp: 0,
  defeated: false,
  ...overrides,
});
const event = (id: string): EventEntry => ({ kind: 'event', id, name: id });

describe('buildPlanRows', () => {
  it('maps an event to an event row without an amount, and a combatant to its parsed amount, whether it has HP and whether it is defeated', () => {
    const rows = buildPlanRows(
      [
        combatant('a'),
        event('e'),
        combatant('b', { maxHp: null, currentHp: null, defeated: true }),
        combatant('c'),
      ],
      (id) => ({ a: '4', b: '1e1', c: 'x', e: '9' })[id] ?? '',
    );

    expect(rows).toEqual([
      { kind: 'combatant', id: 'a', amount: 4, hasHp: true, defeated: false },
      { kind: 'event', id: 'e' },
      { kind: 'combatant', id: 'b', amount: 10, hasHp: false, defeated: true },
      {
        kind: 'combatant',
        id: 'c',
        amount: null,
        hasHp: true,
        defeated: false,
      },
    ]);
  });
});
