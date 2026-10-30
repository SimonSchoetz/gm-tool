import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { nameQueueItems } from '../nameQueueItems';

const goblin = (id: string, sequence_number: number) =>
  buildEncounterQueueItem({ id, name: 'Goblin', sequence_number });
const states = (removedIds: string[]) =>
  new Map(
    ['a', 'b', 'c'].map((id) => [id, { removed: removedIds.includes(id) }]),
  );
const shownNames = (names: ReturnType<typeof nameQueueItems>) =>
  [...names].map(([id, { shownName }]) => [id, shownName]);

describe('nameQueueItems', () => {
  it('names a removed item among all items while its kept sibling keeps the bare queue name', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2)],
      states(['b']),
      [],
    );

    expect(shownNames(names)).toEqual([
      ['a', 'Goblin'],
      ['b', 'Goblin 2'],
    ]);
  });

  it('numbers two removed items when none is kept', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2)],
      states(['a', 'b']),
      [],
    );

    expect(shownNames(names)).toEqual([
      ['a', 'Goblin 1'],
      ['b', 'Goblin 2'],
    ]);
  });

  it('leaves a lone removed item without a number', () => {
    const names = nameQueueItems([goblin('a', 1)], states(['a']), []);

    expect(shownNames(names)).toEqual([['a', 'Goblin']]);
  });

  it('numbers both siblings once the removal is no longer in effect', () => {
    const items = [goblin('a', 1), goblin('b', 2)];

    expect(shownNames(nameQueueItems(items, states(['b']), []))[0]).toEqual([
      'a',
      'Goblin',
    ]);
    expect(shownNames(nameQueueItems(items, states([]), []))).toEqual([
      ['a', 'Goblin 1'],
      ['b', 'Goblin 2'],
    ]);
  });

  it('names an item absent from the combat state as not removed', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2)],
      new Map([['b', { removed: true }]]),
      [],
    );

    expect(shownNames(names)).toEqual([
      ['a', 'Goblin'],
      ['b', 'Goblin 2'],
    ]);
  });

  it('renames kept and removed items alike when the entity is renamed', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2), goblin('c', 3)],
      states(['c']),
      [buildBaseEntity({ name: 'Troll' })],
    );

    expect(shownNames(names)).toEqual([
      ['a', 'Troll 1'],
      ['b', 'Troll 2'],
      ['c', 'Troll 3'],
    ]);
  });

  it('gives every item a base name without its number', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2)],
      states(['b']),
      [],
    );

    expect([...names].map(([id, { baseName }]) => [id, baseName])).toEqual([
      ['a', 'Goblin'],
      ['b', 'Goblin'],
    ]);
  });

  it('shows a renamed kept item its name and keeps its sibling numbered', () => {
    const names = nameQueueItems(
      [
        buildEncounterQueueItem({
          id: 'a',
          name: 'Goblin',
          custom_name: 'Boss',
          sequence_number: 1,
        }),
        goblin('b', 2),
      ],
      states([]),
      [],
    );

    expect(shownNames(names)).toEqual([
      ['a', 'Boss'],
      ['b', 'Goblin 2'],
    ]);
  });

  it('shows a renamed removed item its name', () => {
    const names = nameQueueItems(
      [
        buildEncounterQueueItem({
          id: 'a',
          name: 'Goblin',
          custom_name: 'Boss',
          sequence_number: 1,
        }),
        goblin('b', 2),
      ],
      states(['a']),
      [],
    );

    expect(shownNames(names)[0]).toEqual(['a', 'Boss']);
  });

  it('takes the automatic name of a removed item from the pass over all items', () => {
    const names = nameQueueItems(
      [goblin('a', 1), goblin('b', 2)],
      states(['b']),
      [],
    );

    expect(
      [...names].map(([id, { automaticName }]) => [id, automaticName]),
    ).toEqual([
      ['a', 'Goblin'],
      ['b', 'Goblin 2'],
    ]);
  });

  describe('events and random combatants', () => {
    const event = (id: string, name: string | null, overrides = {}) =>
      buildEncounterQueueItem({
        id,
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name,
        ...overrides,
      });
    const grunt = (id: string, sequence_number: number, overrides = {}) =>
      buildEncounterQueueItem({
        id,
        base_entity_id: null,
        name: 'Grunt',
        sequence_number,
        ...overrides,
      });

    it('reads an event beside a random combatant of the same name bare for both', () => {
      const names = nameQueueItems(
        [event('a', 'Grunt'), grunt('b', 1)],
        states([]),
        [],
      );

      expect(shownNames(names)).toEqual([
        ['a', 'Grunt'],
        ['b', 'Grunt'],
      ]);
    });

    it('shows Untitled Event as shown, automatic and base name for an emptied or spaces-only event name, and ignores custom_name', () => {
      const names = nameQueueItems(
        [
          event('a', null),
          event('b', '   '),
          event('c', null, { custom_name: 'Renamed' }),
        ],
        states([]),
        [],
      );

      expect([...names.values()]).toEqual(
        ['a', 'b', 'c'].map(() => ({
          shownName: 'Untitled Event',
          automaticName: 'Untitled Event',
          baseName: 'Untitled Event',
        })),
      );
    });

    it('numbers random combatants by their exact name, keeps the number of a removed one and lets a renamed one count for its sibling', () => {
      const names = nameQueueItems(
        [
          grunt('a', 1),
          grunt('b', 2),
          grunt('c', 3, { custom_name: 'Boss' }),
          grunt('d', 1, { name: 'grunt' }),
        ],
        states(['a', 'c']),
        [],
      );

      expect(shownNames(names)).toEqual([
        ['a', 'Grunt 1'],
        ['b', 'Grunt'],
        ['c', 'Boss'],
        ['d', 'grunt'],
      ]);
    });

    it('numbers two random combatants of one name', () => {
      const names = nameQueueItems(
        [grunt('a', 1), grunt('b', 2)],
        states([]),
        [],
      );

      expect(shownNames(names)).toEqual([
        ['a', 'Grunt 1'],
        ['b', 'Grunt 2'],
      ]);
    });
  });
});
