import { describe, expect, it } from 'vitest';
import type { CombatantEntry, EventEntry } from '../buildQueueEntries';
import { isEventEntry } from '../isEventEntry';

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

describe('isEventEntry', () => {
  it('accepts an event entry and rejects a combatant entry and null', () => {
    expect(isEventEntry(event)).toBe(true);
    expect(isEventEntry(combatant)).toBe(false);
    expect(isEventEntry(null)).toBe(false);
  });
});
