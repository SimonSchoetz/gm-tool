import { describe, it, expect } from 'vitest';
import {
  shownCombatantBaseName,
  shownCombatantNames,
} from '../shownCombatantNames';

const item = (
  id: string,
  overrides: Partial<{
    baseEntityId: string | null;
    name: string | null;
    sequenceNumber: number | null;
  }> = {},
) => ({
  id,
  baseEntityId: 'goblin',
  name: 'Goblin',
  sequenceNumber: 1,
  ...overrides,
});

const entities = (...entries: [string, string | null][]) => new Map(entries);

describe('shownCombatantNames', () => {
  it('shows the bare name of a single combatant', () => {
    expect(
      shownCombatantNames([item('a')], entities(['goblin', 'Goblin'])).get('a'),
    ).toBe('Goblin');
  });

  it('numbers two combatants of one entity', () => {
    const names = shownCombatantNames(
      [item('a', { sequenceNumber: 1 }), item('b', { sequenceNumber: 2 })],
      entities(['goblin', 'Goblin']),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin 1', 'Goblin 2']);
  });

  it('keeps the gap in the numbers instead of renumbering by position', () => {
    const names = shownCombatantNames(
      [item('a', { sequenceNumber: 1 }), item('b', { sequenceNumber: 3 })],
      entities(['goblin', 'Goblin']),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin 1', 'Goblin 3']);
  });

  it('shows the current entity name instead of the stored one for a linked combatant', () => {
    expect(
      shownCombatantNames(
        [item('a', { name: 'Old Name' })],
        entities(['goblin', 'Renamed']),
      ).get('a'),
    ).toBe('Renamed');
  });

  it('shows Untitled Combatant for a linked entity without a name and still numbers it', () => {
    const names = shownCombatantNames(
      [item('a', { sequenceNumber: 1 }), item('b', { sequenceNumber: 2 })],
      entities(['goblin', null]),
    );

    expect([names.get('a'), names.get('b')]).toEqual([
      'Untitled Combatant 1',
      'Untitled Combatant 2',
    ]);
  });

  it('shows the stored name of a combatant whose entity is absent from the map', () => {
    expect(
      shownCombatantNames([item('a', { name: 'Stored' })], entities()).get('a'),
    ).toBe('Stored');
  });

  it('shows Untitled Combatant for an unlinked combatant without a stored name', () => {
    expect(
      shownCombatantNames(
        [item('a', { baseEntityId: null, name: null })],
        entities(),
      ).get('a'),
    ).toBe('Untitled Combatant');
  });

  it('does not share a number between two entities with the same name', () => {
    const names = shownCombatantNames(
      [
        item('a', { baseEntityId: 'goblin-1' }),
        item('b', { baseEntityId: 'goblin-2' }),
      ],
      entities(['goblin-1', 'Goblin'], ['goblin-2', 'Goblin']),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin', 'Goblin']);
  });

  it('numbers on for two combatants of a deleted entity that share their stored name', () => {
    const names = shownCombatantNames(
      [item('a', { sequenceNumber: 1 }), item('b', { sequenceNumber: 2 })],
      entities(),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin 1', 'Goblin 2']);
  });

  it('does not number a combatant without a sequence number even beside a sibling', () => {
    const names = shownCombatantNames(
      [item('a', { sequenceNumber: null }), item('b', { sequenceNumber: 2 })],
      entities(['goblin', 'Goblin']),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin', 'Goblin 2']);
  });

  it('does not share a numbering key between a linked combatant and an unlinked one whose stored name equals the entity id', () => {
    const names = shownCombatantNames(
      [
        item('a', { sequenceNumber: 1 }),
        item('b', { baseEntityId: null, name: 'goblin', sequenceNumber: 2 }),
      ],
      entities(['goblin', 'Goblin']),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Goblin', 'goblin']);
  });

  it('does not share a numbering key between unlinked combatants with different stored names', () => {
    const names = shownCombatantNames(
      [
        item('a', { baseEntityId: null, name: 'Orc', sequenceNumber: 1 }),
        item('b', { baseEntityId: null, name: 'Wolf', sequenceNumber: 1 }),
      ],
      entities(),
    );

    expect([names.get('a'), names.get('b')]).toEqual(['Orc', 'Wolf']);
  });

  it('shows the stored name of a combatant without a base entity', () => {
    expect(
      shownCombatantNames(
        [item('a', { baseEntityId: null, name: 'Stored' })],
        entities(['goblin', 'Goblin']),
      ).get('a'),
    ).toBe('Stored');
  });
});

describe('shownCombatantBaseName', () => {
  it('shows the live entity name for a linked combatant and the stored name once its entity is absent', () => {
    expect(
      shownCombatantBaseName(
        item('a', { name: 'Old Name' }),
        entities(['goblin', 'Renamed']),
      ),
    ).toBe('Renamed');
    expect(
      shownCombatantBaseName(item('a', { name: 'Stored' }), entities()),
    ).toBe('Stored');
  });

  it('shows Untitled Combatant when no name is left', () => {
    expect(
      shownCombatantBaseName(
        item('a', { baseEntityId: null, name: null }),
        entities(),
      ),
    ).toBe('Untitled Combatant');
  });

  it('carries no sequence number even beside a sibling', () => {
    const goblins = [
      item('a', { sequenceNumber: 1 }),
      item('b', { sequenceNumber: 2 }),
    ];
    const names = entities(['goblin', 'Goblin']);

    expect(shownCombatantNames(goblins, names).get('a')).toBe('Goblin 1');
    expect(shownCombatantBaseName(goblins[0], names)).toBe('Goblin');
  });
});
