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

  it('keeps every entity name in a name part of its own and the label, separators and figures in text parts', () => {
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
    ]);
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
      ],
      [],
    );

    expect(textsOf(lines)).toEqual(['Damage: Goblin (3)', 'Defeated']);
  });

  it('leaves out every added entry, every entry a revert dropped and every revert entry, keeping the rest in order', () => {
    const lines = buildLogLines(
      [goblin],
      [
        log('e1', 'added', { queueItemIds: ['a'] }),
        damage('e2'),
        damage('e3'),
        log('e4', 'revert', { entryId: 'e2' }),
        log('e5', 'message', { editorState: 'state' }),
        log('e6', 'removed', { queueItemIds: ['a'] }),
        log('e7', 'revert', { entryId: 'e6' }),
      ],
      [],
    );

    expect(lines.map(({ id }) => id)).toEqual(['e3', 'e5']);
  });

  it('offers Revert on every listed automatic entry except a Removed one', () => {
    const lines = buildLogLines(
      [goblin, orc],
      [
        damage('e1'),
        log('e2', 'heal', { targets: [{ queueItemId: 'a', amount: 1 }] }),
        log('e3', 'temp-hp', { targets: [{ queueItemId: 'a', value: 2 }] }),
        log('e4', 'max-hp', { targets: [{ queueItemId: 'a', value: 9 }] }),
        log('e5', 'defeated', { queueItemIds: ['a'] }),
        log('e6', 'undefeated', { queueItemIds: ['a'] }),
        log('e7', 'removed', { queueItemIds: ['b'] }),
      ],
      [],
    );

    expect(
      lines.map((line) =>
        line.kind === 'automatic' ? [line.id, line.isRevertible] : line.kind,
      ),
    ).toEqual([
      ['e1', true],
      ['e2', true],
      ['e3', true],
      ['e4', true],
      ['e5', true],
      ['e6', true],
      ['e7', false],
    ]);
  });

  it.each([
    ['an added entry', log('t', 'added', { queueItemIds: ['a'] }), []],
    ['a message', log('t', 'message', { editorState: 's' }), ['t']],
    ['a revert', log('t', 'revert', { entryId: 'none' }), []],
    [
      'a missing entry',
      log('other', 'message', { editorState: 's' }),
      ['other'],
    ],
  ])(
    'leaves out a revert naming %s, which the derivation ignores',
    (_label, named, expectedIds) => {
      const lines = buildLogLines(
        [goblin],
        [named, log('r', 'revert', { entryId: 't' })],
        [],
      );

      expect(lines.map(({ id }) => id)).toEqual(expectedIds);
    },
  );

  it('leaves out an added or revert entry that fails to read and shows any other entry that fails to read as unreadable', () => {
    const lines = buildLogLines(
      [goblin],
      [
        buildEncounterLogEntry(
          'added',
          { queueItemIds: ['a'] },
          { id: 'h1', payload: '{not json' },
        ),
        buildEncounterLogEntry(
          'revert',
          { entryId: 'x' },
          { id: 'h2', payload: '{"entryId":""}' },
        ),
        buildEncounterLogEntry(
          'added',
          { queueItemIds: ['a'] },
          { id: 'u1', kind: 'constructor', created_at: 'at-u1' },
        ),
        buildEncounterLogEntry(
          'damage',
          { targets: [{ queueItemId: 'a', amount: 1 }] },
          { id: 'u2', payload: '{not json', created_at: 'at-u2' },
        ),
      ],
      [],
    );

    expect(lines).toEqual([
      { kind: 'unreadable', id: 'u1', createdAt: 'at-u1' },
      { kind: 'unreadable', id: 'u2', createdAt: 'at-u2' },
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

  it('names a combatant and an event on a removed line, a blank event as Untitled Event', () => {
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
        log('e2', 'removed', { queueItemIds: ['a', 'b'] }),
        log('e3', 'removed', { queueItemIds: ['c'] }),
      ],
      [],
    );

    expect(textsOf(lines)).toEqual([
      'Removed: Goblin, Lair action',
      'Removed: Untitled Event',
    ]);
  });
});
