import { describe, expect, it } from 'vitest';
import { planGroupAction } from '../planGroupAction';

const row = (
  id: string,
  overrides: Partial<{
    amount: number | null;
    hasHp: boolean;
    defeated: boolean;
  }> = {},
) => ({ id, amount: 5, hasHp: true, defeated: false, ...overrides });

describe('planGroupAction', () => {
  it.each(['damage', 'heal'] as const)(
    '%s lists only the rows with HP set, each with its own amount, in row order',
    (kind) => {
      const plan = planGroupAction(kind, [
        row('a', { amount: 3 }),
        row('b', { hasHp: false, amount: 8 }),
        row('c', { amount: 6 }),
      ]);

      expect(plan).toEqual({
        kind,
        payload: {
          targets: [
            { queueItemId: 'a', amount: 3 },
            { queueItemId: 'c', amount: 6 },
          ],
        },
      });
    },
  );

  it.each(['damage', 'heal'] as const)(
    '%s is null when no row has HP set',
    (kind) => {
      expect(planGroupAction(kind, [row('a', { hasHp: false })])).toBeNull();
    },
  );

  it.each(['temp-hp', 'max-hp'] as const)(
    '%s lists every row with a value, whatever its HP',
    (kind) => {
      const plan = planGroupAction(kind, [
        row('a', { amount: 3 }),
        row('b', { hasHp: false, amount: 8 }),
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

  it.each(['damage', 'heal', 'temp-hp', 'max-hp'] as const)(
    '%s is null when an applicable row has no valid amount',
    (kind) => {
      expect(
        planGroupAction(kind, [row('a'), row('b', { amount: null })]),
      ).toBeNull();
    },
  );

  it.each(['damage', 'heal'] as const)(
    '%s ignores the missing amount of a row it skips',
    (kind) => {
      const plan = planGroupAction(kind, [
        row('a'),
        row('b', { hasHp: false, amount: null }),
      ]);

      expect(plan).toEqual({
        kind,
        payload: { targets: [{ queueItemId: 'a', amount: 5 }] },
      });
    },
  );

  it('lists the rows that are not defeated for Mark defeated and is null when all are defeated', () => {
    expect(
      planGroupAction('defeated', [
        row('a'),
        row('b', { defeated: true }),
        row('c'),
      ]),
    ).toEqual({ kind: 'defeated', payload: { queueItemIds: ['a', 'c'] } });
    expect(
      planGroupAction('defeated', [row('a', { defeated: true })]),
    ).toBeNull();
  });

  it('lists the defeated rows for Unmark defeated and is null when none is defeated', () => {
    expect(
      planGroupAction('undefeated', [row('a'), row('b', { defeated: true })]),
    ).toEqual({ kind: 'undefeated', payload: { queueItemIds: ['b'] } });
    expect(planGroupAction('undefeated', [row('a')])).toBeNull();
  });

  it('lists every row for Remove, defeated or not, and needs no amount', () => {
    expect(
      planGroupAction('removed', [
        row('a', { amount: null }),
        row('b', { defeated: true }),
      ]),
    ).toEqual({ kind: 'removed', payload: { queueItemIds: ['a', 'b'] } });
    expect(planGroupAction('removed', [])).toBeNull();
  });
});
