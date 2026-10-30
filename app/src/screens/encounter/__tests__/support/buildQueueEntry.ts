import type {
  CombatantEntry,
  EventEntry,
} from '../../helper/buildQueueEntries';

export const buildCombatantEntry = (
  overrides: Partial<CombatantEntry> = {},
): CombatantEntry => ({
  kind: 'combatant',
  id: 'item-1',
  name: 'Goblin',
  automaticName: 'Goblin',
  entity: null,
  imageId: null,
  maxHp: 10,
  currentHp: 10,
  tempHp: 0,
  defeated: false,
  ...overrides,
});

export const buildEventEntry = (
  overrides: Partial<EventEntry> = {},
): EventEntry => ({
  kind: 'event',
  id: 'event-1',
  name: 'Lair action',
  ...overrides,
});
