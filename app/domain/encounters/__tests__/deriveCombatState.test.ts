import { describe, it, expect } from 'vitest';
import { deriveCombatState } from '../deriveCombatState';

describe('deriveCombatState', () => {
  it.each([7, 0, -3])(
    'gives max and current HP %i and no temp HP for a starting max HP of %i',
    (startingMaxHp) => {
      expect(deriveCombatState([{ id: 'a', startingMaxHp }]).get('a')).toEqual({
        maxHp: startingMaxHp,
        currentHp: startingMaxHp,
        tempHp: 0,
      });
    },
  );

  it('gives null max and current HP and no temp HP for an unset starting max HP', () => {
    expect(
      deriveCombatState([{ id: 'a', startingMaxHp: null }]).get('a'),
    ).toEqual({ maxHp: null, currentHp: null, tempHp: 0 });
  });

  it('gives every item its own entry', () => {
    const state = deriveCombatState([
      { id: 'a', startingMaxHp: 5 },
      { id: 'b', startingMaxHp: 9 },
    ]);

    expect(state.get('a')?.maxHp).toBe(5);
    expect(state.get('b')?.maxHp).toBe(9);
    expect(state.size).toBe(2);
  });
});
