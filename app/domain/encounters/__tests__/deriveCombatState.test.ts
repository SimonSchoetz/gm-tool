import { describe, it, expect } from 'vitest';
import { deriveCombatState } from '../deriveCombatState';

const entry = (kind: string, payload: unknown) => ({
  kind,
  payload: JSON.stringify(payload),
});
const damage = (queueItemId: string, amount: number) =>
  entry('damage', { targets: [{ queueItemId, amount }] });
const heal = (queueItemId: string, amount: number) =>
  entry('heal', { targets: [{ queueItemId, amount }] });
const tempHp = (queueItemId: string, value: number) =>
  entry('temp-hp', { targets: [{ queueItemId, value }] });
const maxHp = (queueItemId: string, value: number) =>
  entry('max-hp', { targets: [{ queueItemId, value }] });

describe('deriveCombatState', () => {
  it.each([7, 0, -3])(
    'gives max and current HP %i and no temp HP for a starting max HP of %i',
    (startingMaxHp) => {
      expect(
        deriveCombatState([{ id: 'a', startingMaxHp }], []).get('a'),
      ).toEqual({
        maxHp: startingMaxHp,
        currentHp: startingMaxHp,
        tempHp: 0,
        defeated: false,
        removed: false,
      });
    },
  );

  it('gives null max and current HP and no temp HP for an unset starting max HP', () => {
    expect(
      deriveCombatState([{ id: 'a', startingMaxHp: null }], []).get('a'),
    ).toEqual({
      maxHp: null,
      currentHp: null,
      tempHp: 0,
      defeated: false,
      removed: false,
    });
  });

  it('gives every item its own entry', () => {
    const state = deriveCombatState(
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
      deriveCombatState(items, [tempHp('a', 3), damage('a', 2)]).get('a'),
    ).toMatchObject({ currentHp: 10, tempHp: 1 });
    expect(
      deriveCombatState(items, [tempHp('a', 3), damage('a', 20)]).get('a'),
    ).toMatchObject({ currentHp: -7, tempHp: 0 });
  });

  it('leaves HP unchanged when damage or heal hits a combatant without max HP', () => {
    expect(
      deriveCombatState(
        [{ id: 'a', startingMaxHp: null }],
        [damage('a', 4), heal('a', 4)],
      ).get('a'),
    ).toMatchObject({ maxHp: null, currentHp: null, tempHp: 0 });
  });

  it('stops healing at max HP and leaves temp HP alone', () => {
    expect(
      deriveCombatState(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 4), tempHp('a', 5), heal('a', 100)],
      ).get('a'),
    ).toMatchObject({ currentHp: 10, tempHp: 5 });
  });

  it.each([null, 10])(
    'replaces temp HP with the given value when max HP is %s',
    (startingMaxHp) => {
      expect(
        deriveCombatState(
          [{ id: 'a', startingMaxHp }],
          [tempHp('a', 8), tempHp('a', 3)],
        ).get('a')?.tempHp,
      ).toBe(3);
    },
  );

  it('sets current HP with max HP when max HP was null, clamps current HP down to a lower max HP and leaves it for a higher one', () => {
    expect(
      deriveCombatState(
        [{ id: 'a', startingMaxHp: null }],
        [maxHp('a', 12)],
      ).get('a'),
    ).toMatchObject({ maxHp: 12, currentHp: 12 });
    expect(
      deriveCombatState(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 2), maxHp('a', 5)],
      ).get('a'),
    ).toMatchObject({ maxHp: 5, currentHp: 5 });
    expect(
      deriveCombatState(
        [{ id: 'a', startingMaxHp: 10 }],
        [damage('a', 2), maxHp('a', 20)],
      ).get('a'),
    ).toMatchObject({ maxHp: 20, currentHp: 8 });
  });

  it('sets and clears only the combatant flags the entry kind names', () => {
    const items = [{ id: 'a', startingMaxHp: 5 }];

    expect(
      deriveCombatState(items, [
        entry('defeated', { queueItemIds: ['a'] }),
      ]).get('a'),
    ).toMatchObject({ defeated: true, removed: false });
    expect(
      deriveCombatState(items, [
        entry('defeated', { queueItemIds: ['a'] }),
        entry('undefeated', { queueItemIds: ['a'] }),
      ]).get('a'),
    ).toMatchObject({ defeated: false, removed: false });
    expect(
      deriveCombatState(items, [entry('removed', { queueItemIds: ['a'] })]).get(
        'a',
      ),
    ).toMatchObject({ defeated: false, removed: true });
  });

  it('applies entries in the given order', () => {
    const items = [{ id: 'a', startingMaxHp: 10 }];
    const damageFirst = deriveCombatState(items, [
      damage('a', 8),
      heal('a', 5),
    ]).get('a');
    const healFirst = deriveCombatState(items, [
      heal('a', 5),
      damage('a', 8),
    ]).get('a');

    expect(damageFirst?.currentHp).toBe(7);
    expect(healFirst?.currentHp).toBe(2);
  });

  it('applies nothing for an unknown kind, invalid JSON or a failing payload, and still applies later entries', () => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [
        entry('constructor', { targets: [{ queueItemId: 'a', amount: 4 }] }),
        { kind: 'damage', payload: '{not json' },
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
    ['defeated', { queueItemIds: ['gone', 'a'] }, { defeated: true }],
    ['removed', { queueItemIds: ['gone', 'a'] }, { removed: true }],
  ])(
    'skips a %s target with no item and still applies the entry to its other targets',
    (kind, payload, expected) => {
      const state = deriveCombatState(
        [{ id: 'a', startingMaxHp: 10 }],
        [entry(kind, payload)],
      );

      expect(state.get('a')).toMatchObject(expected);
      expect(state.has('gone')).toBe(false);
    },
  );

  it('keeps a removed item in the result', () => {
    const state = deriveCombatState(
      [{ id: 'a', startingMaxHp: 10 }],
      [entry('removed', { queueItemIds: ['a'] })],
    );

    expect(state.has('a')).toBe(true);
  });
});
