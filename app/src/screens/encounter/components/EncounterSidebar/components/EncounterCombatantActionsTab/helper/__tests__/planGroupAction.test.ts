import { describe, expect, it } from 'vitest';
import { planGroupAction } from '../planGroupAction';
import { combatantRow, eventRow } from './support/planRowFixtures';

describe('planGroupAction', () => {
  it.each([
    { kind: 'damage', flags: {} },
    { kind: 'heal', flags: { hpRules: true } },
  ] as const)(
    '$kind lists only the rows with HP set, each with its own amount, in row order',
    ({ kind, flags }) => {
      const plan = planGroupAction(kind, [
        combatantRow('a', { amount: 3 }),
        combatantRow('b', { hasHp: false, amount: 8 }),
        combatantRow('c', { amount: 6 }),
      ]);

      expect(plan).toEqual({
        kind,
        payload: {
          targets: [
            { queueItemId: 'a', amount: 3 },
            { queueItemId: 'c', amount: 6 },
          ],
          ...flags,
        },
      });
    },
  );

  it('current-hp lists only the rows with HP set, each with its own value, a 0 included', () => {
    const plan = planGroupAction('current-hp', [
      combatantRow('a', { amount: 0 }),
      combatantRow('b', { hasHp: false, amount: 8 }),
      combatantRow('c', { amount: 6 }),
    ]);

    expect(plan).toEqual({
      kind: 'current-hp',
      payload: {
        targets: [
          { queueItemId: 'a', value: 0 },
          { queueItemId: 'c', value: 6 },
        ],
      },
    });
  });

  it.each(['damage', 'heal', 'current-hp'] as const)(
    '%s is null when no row has HP set',
    (kind) => {
      expect(
        planGroupAction(kind, [combatantRow('a', { hasHp: false })]),
      ).toBeNull();
    },
  );

  it.each(['temp-hp', 'max-hp'] as const)(
    '%s lists every row with a value, whatever its HP',
    (kind) => {
      const plan = planGroupAction(kind, [
        combatantRow('a', { amount: 3 }),
        combatantRow('b', { hasHp: false, amount: 8 }),
      ]);

      expect(plan).toEqual({
        kind,
        payload: {
          targets: [
            { queueItemId: 'a', value: 3 },
            { queueItemId: 'b', value: 8 },
          ],
        },
      });
    },
  );

  it.each(['damage', 'heal', 'current-hp', 'temp-hp', 'max-hp'] as const)(
    '%s is null when an applicable row has no valid amount',
    (kind) => {
      expect(
        planGroupAction(kind, [
          combatantRow('a'),
          combatantRow('b', { amount: null }),
        ]),
      ).toBeNull();
    },
  );

  it.each([
    { kind: 'damage', payload: { targets: [{ queueItemId: 'a', amount: 5 }] } },
    {
      kind: 'heal',
      payload: { targets: [{ queueItemId: 'a', amount: 5 }], hpRules: true },
    },
    {
      kind: 'current-hp',
      payload: { targets: [{ queueItemId: 'a', value: 5 }] },
    },
  ] as const)(
    '$kind ignores the missing amount of a row it skips',
    ({ kind, payload }) => {
      const plan = planGroupAction(kind, [
        combatantRow('a'),
        combatantRow('b', { hasHp: false, amount: null }),
      ]);

      expect(plan).toEqual({ kind, payload });
    },
  );

  it('lists the rows that are not defeated for Mark defeated and is null when all are defeated', () => {
    expect(
      planGroupAction('defeated', [
        combatantRow('a'),
        combatantRow('b', { defeated: true }),
        combatantRow('c'),
      ]),
    ).toEqual({
      kind: 'defeated',
      payload: { queueItemIds: ['a', 'c'], hpRules: true },
    });
    expect(
      planGroupAction('defeated', [combatantRow('a', { defeated: true })]),
    ).toBeNull();
  });

  it('lists the defeated rows for Unmark defeated and is null when none is defeated', () => {
    expect(
      planGroupAction('undefeated', [
        combatantRow('a'),
        combatantRow('b', { defeated: true }),
      ]),
    ).toEqual({
      kind: 'undefeated',
      payload: { queueItemIds: ['b'], hpRules: true },
    });
    expect(planGroupAction('undefeated', [combatantRow('a')])).toBeNull();
  });

  it('lists every row for Remove, defeated or not, and needs no amount', () => {
    expect(
      planGroupAction('removed', [
        combatantRow('a', { amount: null }),
        combatantRow('b', { defeated: true }),
      ]),
    ).toEqual({ kind: 'removed', payload: { queueItemIds: ['a', 'b'] } });
    expect(planGroupAction('removed', [])).toBeNull();
  });

  it.each(['damage', 'heal', 'current-hp', 'temp-hp', 'max-hp'] as const)(
    '%s leaves an event row out, so an event neither blocks the plan nor receives an amount',
    (kind) => {
      const plan = planGroupAction(kind, [
        eventRow('e'),
        combatantRow('a', { amount: 3 }),
      ]);

      expect(plan?.kind).toBe(kind);
      expect(
        plan !== null && 'targets' in plan.payload
          ? plan.payload.targets.map((target) => target.queueItemId)
          : null,
      ).toEqual(['a']);
    },
  );

  it.each(['defeated', 'undefeated'] as const)(
    '%s leaves an event row out of the listed ids',
    (kind) => {
      const plan = planGroupAction(kind, [
        eventRow('e'),
        combatantRow('a', { defeated: kind === 'undefeated' }),
      ]);

      expect(plan).toEqual({
        kind,
        payload: { queueItemIds: ['a'], hpRules: true },
      });
    },
  );

  it('lists every row for Remove in row order, events included, and gives null for events alone on every other kind', () => {
    expect(
      planGroupAction('removed', [
        combatantRow('a'),
        eventRow('e'),
        combatantRow('b'),
      ]),
    ).toEqual({ kind: 'removed', payload: { queueItemIds: ['a', 'e', 'b'] } });

    for (const kind of [
      'damage',
      'heal',
      'current-hp',
      'temp-hp',
      'max-hp',
      'defeated',
      'undefeated',
    ] as const) {
      expect(planGroupAction(kind, [eventRow('e')])).toBeNull();
    }
    expect(planGroupAction('removed', [eventRow('e')])).toEqual({
      kind: 'removed',
      payload: { queueItemIds: ['e'] },
    });
  });
});
