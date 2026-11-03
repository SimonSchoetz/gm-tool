import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { buildLogLines, type LogLinePart } from '../buildLogLines';

const goblin = buildEncounterQueueItem({ id: 'a', name: 'Goblin' });
const orc = buildEncounterQueueItem({ id: 'b', name: 'Orc' });

const log = (id: string, ...args: Parameters<typeof buildEncounterLogEntry>) =>
  buildEncounterLogEntry(args[0], args[1], { id, created_at: `at-${id}` });
const damage = (id: string, queueItemId = 'a') =>
  log(id, 'damage', { targets: [{ queueItemId, amount: 3 }] });

const joinedText = (parts: LogLinePart[]) =>
  parts.map(({ text }) => text).join('');

const textsOf = (lines: ReturnType<typeof buildLogLines>) =>
  lines.map((line) =>
    line.kind === 'automatic' ? joinedText(line.parts) : line.kind,
  );

describe('buildLogLines', () => {
  it.each([
    [
      'damage',
      {
        targets: [
          { queueItemId: 'a', amount: 3 },
          { queueItemId: 'b', amount: 4 },
        ],
      },
      'Damage: Goblin (3), Orc (4)',
    ],
    [
      'heal',
      { targets: [{ queueItemId: 'a', amount: 2 }] },
      'Heal: Goblin (2)',
    ],
    [
      'temp-hp',
      { targets: [{ queueItemId: 'a', value: 5 }] },
      'Temp HP: Goblin (5)',
    ],
    [
      'max-hp',
      { targets: [{ queueItemId: 'b', value: 30 }] },
      'Max HP: Orc (30)',
    ],
    ['defeated', { queueItemIds: ['a', 'b'] }, 'Defeated: Goblin, Orc'],
    ['undefeated', { queueItemIds: ['b', 'a'] }, 'Undefeated: Orc, Goblin'],
    ['removed', { queueItemIds: ['a'] }, 'Removed: Goblin'],
  ] as const)(
    'reads a %s entry as its label, its targets and the amount or value',
    (kind, payload, expected) => {
      const lines = buildLogLines(
        [goblin, orc],
        [log('e1', kind, payload as never)],
        [],
      );

      expect(textsOf(lines)).toEqual([expected]);
    },
  );

  it('keeps every entity name in a name part of its own and the label, separators, figures and quantity in text parts', () => {
    const goblins = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({ id: 'b', name: 'Goblin', sequence_number: 2 }),
    ];
    const lines = buildLogLines(
      goblins,
      [
        log('e1', 'damage', {
          targets: [
            { queueItemId: 'a', amount: 3 },
            { queueItemId: 'b', amount: 4 },
          ],
        }),
        log('e2', 'defeated', { queueItemIds: ['a', 'b'] }),
        log('e3', 'added', { queueItemIds: ['a', 'b'] }),
        log('e4', 'added', { queueItemIds: ['a'] }),
      ],
      [],
    );

    expect(
      lines.map((line) => (line.kind === 'automatic' ? line.parts : [])),
    ).toEqual([
      [
        { kind: 'text', text: 'Damage: ' },
        { kind: 'name', text: 'Goblin 1' },
        { kind: 'text', text: ' (3)' },
        { kind: 'text', text: ', ' },
        { kind: 'name', text: 'Goblin 2' },
        { kind: 'text', text: ' (4)' },
      ],
      [
        { kind: 'text', text: 'Defeated: ' },
        { kind: 'name', text: 'Goblin 1' },
        { kind: 'text', text: ', ' },
        { kind: 'name', text: 'Goblin 2' },
      ],
      [
        { kind: 'text', text: 'Added: ' },
        { kind: 'name', text: 'Goblin' },
        { kind: 'text', text: ' ×2' },
      ],
      [
        { kind: 'text', text: 'Added: ' },
        { kind: 'name', text: 'Goblin' },
      ],
    ]);
  });

  it('shows the base name once on an added line and a quantity only above one', () => {
    const goblins = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({ id: 'b', name: 'Goblin', sequence_number: 2 }),
    ];

    expect(
      textsOf(
        buildLogLines(
          goblins,
          [
            log('e1', 'added', { queueItemIds: ['a'] }),
            log('e2', 'added', { queueItemIds: ['a', 'b'] }),
          ],
          [],
        ),
      ),
    ).toEqual(['Added: Goblin', 'Added: Goblin ×2']);
  });

  it('names an added line after its first target that still has a queue item', () => {
    expect(
      textsOf(
        buildLogLines(
          [orc],
          [log('e1', 'added', { queueItemIds: ['gone', 'b'] })],
          [],
        ),
      ),
    ).toEqual(['Added: Orc ×2']);
  });

  it('names a removed combatant as the log numbers it while the queue shows another name', () => {
    const goblins = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({ id: 'b', name: 'Goblin', sequence_number: 2 }),
    ];

    expect(
      textsOf(
        buildLogLines(
          goblins,
          [
            damage('e1', 'a'),
            damage('e2', 'b'),
            log('e3', 'removed', { queueItemIds: ['b'] }),
          ],
          [],
        ),
      ),
    ).toEqual([
      'Damage: Goblin (3)',
      'Damage: Goblin 2 (3)',
      'Removed: Goblin 2',
    ]);
  });

  it('leaves out a target with no queue item and shows the label alone when none is left', () => {
    const lines = buildLogLines(
      [goblin],
      [
        log('e1', 'damage', {
          targets: [
            { queueItemId: 'gone', amount: 1 },
            { queueItemId: 'a', amount: 3 },
          ],
        }),
        log('e2', 'defeated', { queueItemIds: ['gone'] }),
        log('e3', 'added', { queueItemIds: ['gone'] }),
      ],
      [],
    );

    expect(textsOf(lines)).toEqual(['Damage: Goblin (3)', 'Defeated', 'Added']);
  });

  it('marks a reverted entry, words its revert from the reverted entry and offers Revert only on entries still in effect', () => {
    const lines = buildLogLines(
      [goblin],
      [
        log('e1', 'added', { queueItemIds: ['a'] }),
        damage('e2'),
        damage('e3'),
        log('e4', 'revert', { entryId: 'e2' }),
        log('e5', 'message', { editorState: 'state' }),
      ],
      [],
    );

    expect(lines).toEqual([
      expect.objectContaining({
        id: 'e1',
        isReverted: false,
        isRevertible: false,
      }),
      expect.objectContaining({
        id: 'e2',
        parts: [
          { kind: 'text', text: 'Damage: ' },
          { kind: 'name', text: 'Goblin' },
          { kind: 'text', text: ' (3)' },
        ],
        isReverted: true,
        isRevertible: false,
      }),
      expect.objectContaining({
        id: 'e3',
        isReverted: false,
        isRevertible: true,
      }),
      expect.objectContaining({
        id: 'e4',
        kind: 'automatic',
        parts: [
          { kind: 'text', text: 'Reverted: ' },
          { kind: 'text', text: 'Damage: ' },
          { kind: 'name', text: 'Goblin' },
          { kind: 'text', text: ' (3)' },
        ],
        isReverted: false,
        isRevertible: false,
      }),
      expect.objectContaining({ id: 'e5', kind: 'message' }),
    ]);
  });

  it.each([
    [
      'a revert naming an added entry',
      log('t', 'added', { queueItemIds: ['a'] }),
    ],
    ['a revert naming a message', log('t', 'message', { editorState: 's' })],
    ['a revert naming a revert', log('t', 'revert', { entryId: 'none' })],
  ])('reads %s as unreadable', (_label, named) => {
    const lines = buildLogLines(
      [goblin],
      [named, log('r', 'revert', { entryId: 't' })],
      [],
    );

    expect(lines[1]).toEqual({
      kind: 'unreadable',
      id: 'r',
      createdAt: 'at-r',
    });
  });

  it('reads a revert naming a missing entry, an unknown kind and invalid JSON as unreadable', () => {
    const lines = buildLogLines(
      [goblin],
      [
        log('r', 'revert', { entryId: 'missing' }),
        buildEncounterLogEntry(
          'added',
          { queueItemIds: ['a'] },
          { id: 'u1', kind: 'constructor', created_at: 'at-u1' },
        ),
        buildEncounterLogEntry(
          'added',
          { queueItemIds: ['a'] },
          { id: 'u2', payload: '{not json', created_at: 'at-u2' },
        ),
      ],
      [],
    );

    expect(lines.map(({ kind, id }) => [kind, id])).toEqual([
      ['unreadable', 'r'],
      ['unreadable', 'u1'],
      ['unreadable', 'u2'],
    ]);
  });

  it('carries a message with its editor state and time, and words earlier lines with a renamed entity name', () => {
    const lines = buildLogLines(
      [goblin],
      [damage('e1'), log('e2', 'message', { editorState: 'state-2' })],
      [buildBaseEntity({ name: 'Troll' })],
    );

    expect(lines).toEqual([
      expect.objectContaining({
        parts: [
          { kind: 'text', text: 'Damage: ' },
          { kind: 'name', text: 'Troll' },
          { kind: 'text', text: ' (3)' },
        ],
        createdAt: 'at-e1',
      }),
      {
        kind: 'message',
        id: 'e2',
        createdAt: 'at-e2',
        editorState: 'state-2',
      },
    ]);
  });

  it('names a renamed combatant on a Damage line', () => {
    const boss = buildEncounterQueueItem({
      id: 'a',
      name: 'Goblin',
      custom_name: 'Boss',
    });

    expect(textsOf(buildLogLines([boss], [damage('e1')], []))).toEqual([
      'Damage: Boss (3)',
    ]);
  });

  it('keeps the entity name on an added line whose first item is renamed', () => {
    const items = [
      buildEncounterQueueItem({
        id: 'a',
        name: 'Goblin',
        custom_name: 'Boss',
        sequence_number: 1,
      }),
      buildEncounterQueueItem({
        id: 'b',
        name: 'Goblin',
        sequence_number: 2,
      }),
    ];

    expect(
      textsOf(
        buildLogLines(
          items,
          [log('e1', 'added', { queueItemIds: ['a', 'b'] })],
          [],
        ),
      ),
    ).toEqual(['Added: Goblin ×2']);
  });

  it('names an event on an added line and a combatant and an event on a removed line, a blank event as Untitled Event', () => {
    const items = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({
        id: 'b',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: 'Lair action',
      }),
      buildEncounterQueueItem({
        id: 'c',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: null,
      }),
    ];
    const lines = buildLogLines(
      items,
      [
        log('e1', 'added', { queueItemIds: ['b'] }),
        log('e2', 'removed', { queueItemIds: ['a', 'b'] }),
        log('e3', 'removed', { queueItemIds: ['c'] }),
      ],
      [],
    );

    expect(textsOf(lines)).toEqual([
      'Added: Lair action',
      'Removed: Goblin, Lair action',
      'Removed: Untitled Event',
    ]);
  });
});
