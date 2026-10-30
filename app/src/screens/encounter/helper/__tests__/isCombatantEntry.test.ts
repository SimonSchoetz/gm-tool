import { describe, expect, it } from 'vitest';
import type { CombatantEntry, EventEntry } from '../buildQueueEntries';
import { isCombatantEntry } from '../isCombatantEntry';

const combatant: CombatantEntry = {
  kind: 'combatant',
  id: 'a',
  name: 'Goblin',
  automaticName: 'Goblin',
  entity: null,
  imageId: null,
  maxHp: null,
  currentHp: null,
  tempHp: 0,
  defeated: false,
};
const event: EventEntry = { kind: 'event', id: 'e', name: 'Lair action' };

describe('isCombatantEntry', () => {
  it('accepts a combatant entry and rejects an event entry and null', () => {
    expect(isCombatantEntry(combatant)).toBe(true);
    expect(isCombatantEntry(event)).toBe(false);
    expect(isCombatantEntry(null)).toBe(false);
  });
});
