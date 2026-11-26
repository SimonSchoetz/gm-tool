import { describe, expect, it } from 'vitest';
import { pickDefeatedAction } from '../pickDefeatedAction';
import { combatantRow, eventRow } from './support/planRowFixtures';

const MARK = { kind: 'defeated', label: 'Mark defeated' };
const UNMARK = { kind: 'undefeated', label: 'Unmark defeated' };

describe('pickDefeatedAction', () => {
  it.each([
    { selection: 'no row', rows: [] },
    { selection: 'events alone', rows: [eventRow('e')] },
  ])('picks Mark defeated for $selection', ({ rows }) => {
    expect(pickDefeatedAction(rows)).toEqual(MARK);
  });

  it('picks Mark defeated while any combatant is not defeated', () => {
    expect(
      pickDefeatedAction([
        combatantRow('a', { defeated: true }),
        combatantRow('b', { defeated: false }),
      ]),
    ).toEqual(MARK);
  });

  it('picks Unmark defeated when every combatant is defeated', () => {
    expect(
      pickDefeatedAction([
        combatantRow('a', { defeated: true }),
        combatantRow('b', { defeated: true }),
      ]),
    ).toEqual(UNMARK);
  });

  it('leaves an event out when it decides whether every combatant is defeated', () => {
    expect(
      pickDefeatedAction([
        eventRow('e'),
        combatantRow('a', { defeated: true }),
      ]),
    ).toEqual(UNMARK);
  });
});
