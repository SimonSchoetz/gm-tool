import { describe, expect, it } from 'vitest';
import { parseRandomCombatantHp } from '../randomCombatantHp';

describe('parseRandomCombatantHp', () => {
  it.each(['', '   '])('reads %j as valid with no HP', (raw) => {
    expect(parseRandomCombatantHp(raw)).toEqual({ valid: true, hp: null });
  });

  it.each([
    ['0', 0],
    ['12', 12],
    ['1e3', 1000],
  ])('reads %j as valid with HP %i', (raw, hp) => {
    expect(parseRandomCombatantHp(raw)).toEqual({ valid: true, hp });
  });

  it.each(['abc', '-1', '1.5'])('reads %j as invalid', (raw) => {
    expect(parseRandomCombatantHp(raw)).toEqual({ valid: false });
  });
});
