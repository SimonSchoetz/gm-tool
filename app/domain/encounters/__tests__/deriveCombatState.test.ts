import { describe, it, expect } from 'vitest';
import { deriveCombatState } from '../deriveCombatState';

let entryCount = 0;
const entry = (
  kind: string,
  payload: unknown,
  id = `entry-${(entryCount += 1)}`,
) => ({
  id,
  kind,
  payload: JSON.stringify(payload),
});
const damage = (queueItemId: string, amount: number, id?: string) =>
  entry('damage', { targets: [{ queueItemId, amount }] }, id);
const heal = (queueItemId: string, amount: number, id?: string) =>
  entry('heal', { targets: [{ queueItemId, amount }] }, id);
const tempHp = (queueItemId: string, value: number, id?: string) =>
  entry('temp-hp', { targets: [{ queueItemId, value }] }, id);
const maxHp = (queueItemId: string, value: number, id?: string) =>
  entry('max-hp', { targets: [{ queueItemId, value }] }, id);
const currentHp = (queueItemId: string, value: number, id?: string) =>
  entry('current-hp', { targets: [{ queueItemId, value }] }, id);
const ruledHeal = (queueItemId: string, amount: number, id?: string) =>
  entry('heal', { targets: [{ queueItemId, amount }], hpRules: true }, id);
const mark = (queueItemId: string, id?: string) =>
  entry('defeated', { queueItemIds: [queueItemId] }, id);
const ruledMark = (queueItemId: string, id?: string) =>
  entry('defeated', { queueItemIds: [queueItemId], hpRules: true }, id);
const ruledUnmark = (queueItemId: string, id?: string) =>
  entry('undefeated', { queueItemIds: [queueItemId], hpRules: true }, id);
const revert = (entryId: string, id?: string) =>
  entry('revert', { entryId }, id);

const derive = (...args: Parameters<typeof deriveCombatState>) =>
  deriveCombatState(...args).items;

describe('deriveCombatState', () => {
  it.each([7, 0, -3])(
    'gives max and current HP %i and no temp HP for a starting max HP of %i',
    (startingMaxHp) => {
      expect(derive([{ id: 'a', startingMaxHp }], []).get('a')).toEqual({
        maxHp: startingMaxHp,
        currentHp: startingMaxHp,
        tempHp: 0,
        defeated: false,
        removed: false,
      });
    },
  );

  it('gives null max and current HP and no temp HP for an unset starting max HP', () => {
    expect(derive([{ id: 'a', startingMaxHp: null }], []).get('a')).toEqual({
      maxHp: null,
      currentHp: null,
      tempHp: 0,
      defeated: false,
      removed: false,
    });
  });

  it('gives every item its own entry', () => {
    const state = derive(
      [
        { id: 'a', startingMaxHp: 5 },
        { id: 'b', startingMaxHp: 9 },
      ],
      [],
    );

    expect(state.get('a')?.maxHp).toBe(5);
    expect(state.get('b')?.maxHp).toBe(9);
    expect(state.size).toBe(2);
  });

  it('drains temp HP before current HP when damaged, and lets current HP fall below 0', () => {
    const items = [{ id: 'a', startingMaxHp: 10 }];

    expect(
      derive(items, [tempHp('a', 3), damage('a', 2)]).get('a'),
    ).toMatchObject({ currentHp: 10, tempHp: 1 });
    expect(
      derive(items, [tempHp('a', 3), damage('a', 20)]).get('a'),
    ).toMatchObject({ currentHp: -7, tempHp: 0 });
  });

  it('leaves HP unchanged when damage or heal hits a combatant without max HP', () => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: null }],
        [damage('a', 4), heal('a', 4)],
      ).get('a'),
    ).toMatchObject({ maxHp: null, currentHp: null, tempHp: 0 });
  });

  it('stops healing at max HP and leaves temp HP alone', () => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 4), tempHp('a', 5), heal('a', 100)],
      ).get('a'),
    ).toMatchObject({ currentHp: 10, tempHp: 5 });
  });

  it.each([null, 10])(
    'replaces temp HP with the given value when max HP is %s',
    (startingMaxHp) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp }],
          [tempHp('a', 8), tempHp('a', 3)],
        ).get('a')?.tempHp,
      ).toBe(3);
    },
  );

  it('sets current HP with max HP when max HP was null, clamps current HP down to a lower max HP and leaves it for a higher one', () => {
    expect(
      derive([{ id: 'a', startingMaxHp: null }], [maxHp('a', 12)]).get('a'),
    ).toMatchObject({ maxHp: 12, currentHp: 12 });
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 2), maxHp('a', 5)],
      ).get('a'),
    ).toMatchObject({ maxHp: 5, currentHp: 5 });
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 2), maxHp('a', 20)],
      ).get('a'),
    ).toMatchObject({ maxHp: 20, currentHp: 8 });
  });

  it('sets and clears only the combatant flags the entry kind names', () => {
    const items = [{ id: 'a', startingMaxHp: 5 }];

    expect(derive(items, [mark('a')]).get('a')).toMatchObject({
      defeated: true,
      removed: false,
    });
    expect(
      derive(items, [
        mark('a'),
        entry('undefeated', { queueItemIds: ['a'] }),
      ]).get('a'),
    ).toMatchObject({ defeated: false, removed: false });
    expect(
      derive(items, [entry('removed', { queueItemIds: ['a'] })]).get('a'),
    ).toMatchObject({ defeated: false, removed: true });
  });

  it('applies entries in the given order', () => {
    const items = [{ id: 'a', startingMaxHp: 10 }];
    const damageFirst = derive(items, [damage('a', 8), heal('a', 5)]).get('a');
    const healFirst = derive(items, [heal('a', 5), damage('a', 8)]).get('a');

    expect(damageFirst?.currentHp).toBe(7);
    expect(healFirst?.currentHp).toBe(2);
  });

  it('applies nothing for an unknown kind, invalid JSON or a failing payload, and still applies later entries', () => {
    const state = derive(
      [{ id: 'a', startingMaxHp: 10 }],
      [
        entry('constructor', { targets: [{ queueItemId: 'a', amount: 4 }] }),
        { id: 'broken', kind: 'damage', payload: '{not json' },
        damage('a', -4),
        damage('a', 1),
      ],
    );

    expect(state.get('a')?.currentHp).toBe(9);
  });

  it.each([
    [
      'damage',
      {
        targets: [
          { queueItemId: 'gone', amount: 3 },
          { queueItemId: 'a', amount: 3 },
        ],
      },
      { currentHp: 7 },
    ],
    [
      'heal',
      {
        targets: [
          { queueItemId: 'gone', amount: 3 },
          { queueItemId: 'a', amount: 3 },
        ],
      },
      { currentHp: 10 },
    ],
    [
      'temp-hp',
      {
        targets: [
          { queueItemId: 'gone', value: 3 },
          { queueItemId: 'a', value: 3 },
        ],
      },
      { tempHp: 3 },
    ],
    [
      'max-hp',
      {
        targets: [
          { queueItemId: 'gone', value: 4 },
          { queueItemId: 'a', value: 4 },
        ],
      },
      { maxHp: 4 },
    ],
    [
      'current-hp',
      {
        targets: [
          { queueItemId: 'gone', value: 4 },
          { queueItemId: 'a', value: 4 },
        ],
      },
      { currentHp: 4 },
    ],
    ['defeated', { queueItemIds: ['gone', 'a'] }, { defeated: true }],
    ['removed', { queueItemIds: ['gone', 'a'] }, { removed: true }],
  ])(
    'skips a %s target with no item and still applies the entry to its other targets',
    (kind, payload, expected) => {
      const state = derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [entry(kind, payload)],
      );

      expect(state.get('a')).toMatchObject(expected);
      expect(state.has('gone')).toBe(false);
    },
  );

  it('keeps a removed item in the result', () => {
    const state = derive(
      [{ id: 'a', startingMaxHp: 10 }],
      [entry('removed', { queueItemIds: ['a'] })],
    );

    expect(state.has('a')).toBe(true);
  });

  it('replays the remaining entries when an earlier damage that a later heal had capped is reverted', () => {
    const items = [{ id: 'a', startingMaxHp: 10 }];

    expect(
      deriveCombatState(items, [
        damage('a', 8, 'hit'),
        heal('a', 100),
        revert('hit'),
      ]),
    ).toMatchObject({
      items: new Map([['a', { currentHp: 10 }]]),
      revertedEntryIds: new Set(['hit']),
    });
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 20 }],
        [damage('a', 10), damage('a', 4, 'hit'), heal('a', 3), revert('hit')],
      ).get('a')?.currentHp,
    ).toBe(13);
  });

  it.each([
    ['max-hp', [maxHp('a', 5, 'target')], { maxHp: 10, currentHp: 10 }],
    ['temp-hp', [tempHp('a', 4, 'target')], { tempHp: 0 }],
    ['defeated', [mark('a', 'target')], { defeated: false }],
    [
      'undefeated',
      [mark('a'), entry('undefeated', { queueItemIds: ['a'] }, 'target')],
      { defeated: true },
    ],
    [
      'removed',
      [entry('removed', { queueItemIds: ['a'] }, 'target')],
      { removed: false },
    ],
  ])(
    'gives the state without a reverted %s entry',
    (_kind, entries, expected) => {
      const state = deriveCombatState(
        [{ id: 'a', startingMaxHp: 10 }],
        [...entries, revert('target')],
      );

      expect(state.items.get('a')).toMatchObject(expected);
      expect(state.revertedEntryIds).toEqual(new Set(['target']));
    },
  );

  it.each([
    ['a revert', revert('missing', 'target')],
    ['an added entry', entry('added', { queueItemIds: ['a'] }, 'target')],
    ['a message', entry('message', { editorState: '{}' }, 'target')],
    ['an unreadable entry', { id: 'target', kind: 'damage', payload: '{no' }],
    ['a missing entry', null],
  ])('ignores a revert naming %s', (_label, named) => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [
        damage('a', 4, 'hit'),
        ...(named === null ? [] : [named]),
        revert('target'),
      ],
    );

    expect(state.items.get('a')?.currentHp).toBe(6);
    expect(state.revertedEntryIds).toEqual(new Set());
  });

  it('keeps an entry dropped when the revert that dropped it is itself reverted', () => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [damage('a', 4, 'hit'), revert('hit', 'undo'), revert('undo')],
    );

    expect(state.items.get('a')?.currentHp).toBe(10);
    expect(state.revertedEntryIds).toEqual(new Set(['hit']));
  });

  it('lists an entry once and drops it once when two reverts name it', () => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [damage('a', 4, 'hit'), revert('hit'), revert('hit')],
    );

    expect(state.items.get('a')?.currentHp).toBe(10);
    expect(state.revertedEntryIds).toEqual(new Set(['hit']));
  });

  it('drops an entry that comes after the revert naming it', () => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [revert('hit'), damage('a', 4, 'hit')],
    );

    expect(state.items.get('a')?.currentHp).toBe(10);
    expect(state.revertedEntryIds).toEqual(new Set(['hit']));
  });

  it.each([
    ['lowers', 0, 4, 4],
    ['raises', 8, 6, 6],
    ['raises from below 0', 15, 3, 3],
    ['caps at max HP', 8, 20, 10],
  ])(
    '%s current HP with a current-hp entry and leaves max and temp HP',
    (_label, damaged, value, expected) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp: 10 }],
          [damage('a', damaged), tempHp('a', 2), currentHp('a', value)],
        ).get('a'),
      ).toMatchObject({ maxHp: 10, currentHp: expected, tempHp: 2 });
    },
  );

  it.each([
    ['unmarks a defeated combatant above 0', [mark('a')], 1, false],
    ['keeps the mark at 0', [mark('a')], 0, true],
    ['never marks at 0', [], 0, false],
  ])('a current-hp entry %s', (_label, before, value, defeated) => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [...before, currentHp('a', value)],
      ).get('a')?.defeated,
    ).toBe(defeated);
  });

  it('keeps the mark when max HP 0 caps the HP of a current-hp entry above 0 at 0', () => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 0 }],
        [mark('a'), currentHp('a', 5)],
      ).get('a'),
    ).toMatchObject({ currentHp: 0, defeated: true });
  });

  it('leaves a combatant without HP and its mark alone for a current-hp or ruled heal entry', () => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: null }],
        [mark('a'), currentHp('a', 4), ruledHeal('a', 4)],
      ).get('a'),
    ).toMatchObject({ maxHp: null, currentHp: null, defeated: true });
  });

  it.each([
    [12, 1, false],
    [12, 0, true],
    [15, 2, true],
  ])(
    'after %i damage and a mark, a ruled heal of %i unmarks only when HP ends above 0 (still marked: %s)',
    (damaged, healed, defeated) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp: 12 }],
          [damage('a', damaged), mark('a'), ruledHeal('a', healed)],
        ).get('a')?.defeated,
      ).toBe(defeated);
    },
  );

  it('changes no HP and unmarks nothing for heal, defeated and undefeated entries stored without hpRules', () => {
    const items = [{ id: 'a', startingMaxHp: 10 }];

    expect(
      derive(items, [damage('a', 3), mark('a'), heal('a', 1)]).get('a'),
    ).toMatchObject({ currentHp: 8, defeated: true });
    expect(derive(items, [tempHp('a', 2), mark('a')]).get('a')).toMatchObject({
      currentHp: 10,
      tempHp: 2,
      defeated: true,
    });
    expect(
      derive(items, [
        damage('a', 14),
        mark('a'),
        entry('undefeated', { queueItemIds: ['a'] }),
      ]).get('a'),
    ).toMatchObject({ currentHp: -4, defeated: false });
  });

  it.each([3, 14])(
    'sets current HP and temp HP to 0 with a ruled defeated entry after temp HP 2 and %i damage taken before it',
    (damaged) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp: 10 }],
          [damage('a', damaged), tempHp('a', 2), ruledMark('a')],
        ).get('a'),
      ).toMatchObject({ currentHp: 0, tempHp: 0, defeated: true });
    },
  );

  it('only marks and unmarks a combatant without HP with ruled entries, keeping its temp HP', () => {
    const items = [{ id: 'a', startingMaxHp: null }];
    const unset = { maxHp: null, currentHp: null, tempHp: 4, removed: false };

    expect(derive(items, [tempHp('a', 4), ruledMark('a')]).get('a')).toEqual({
      ...unset,
      defeated: true,
    });
    expect(
      derive(items, [tempHp('a', 4), ruledMark('a'), ruledUnmark('a')]).get(
        'a',
      ),
    ).toEqual({ ...unset, defeated: false });
  });

  it.each([
    [14, 1],
    [10, 1],
    [9, 1],
    [4, 6],
  ])(
    'after %i damage, a ruled undefeated entry unmarks and leaves current HP %i',
    (damaged, expected) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp: 10 }],
          [damage('a', damaged), mark('a'), ruledUnmark('a')],
        ).get('a'),
      ).toMatchObject({ currentHp: expected, defeated: false });
    },
  );

  it('gives temp HP to a defeated combatant and keeps it defeated', () => {
    expect(
      derive(
        [{ id: 'a', startingMaxHp: 10 }],
        [ruledMark('a'), tempHp('a', 3)],
      ).get('a'),
    ).toMatchObject({ currentHp: 0, tempHp: 3, defeated: true });
  });

  it.each([
    [
      'current-hp',
      [ruledMark('a'), currentHp('a', 4, 'target')],
      { currentHp: 0, tempHp: 0, defeated: true },
    ],
    [
      'ruled heal',
      [ruledMark('a'), ruledHeal('a', 4, 'target')],
      { currentHp: 0, tempHp: 0, defeated: true },
    ],
    [
      'ruled defeated',
      [damage('a', 3), tempHp('a', 2), ruledMark('a', 'target')],
      { currentHp: 7, tempHp: 2, defeated: false },
    ],
    [
      'ruled undefeated',
      [ruledMark('a'), ruledUnmark('a', 'target')],
      { currentHp: 0, tempHp: 0, defeated: true },
    ],
  ])(
    'restores HP and the mark when a %s entry is reverted',
    (_label, entries, expected) => {
      expect(
        derive(
          [{ id: 'a', startingMaxHp: 10 }],
          [...entries, revert('target')],
        ).get('a'),
      ).toMatchObject(expected);
    },
  );
});
