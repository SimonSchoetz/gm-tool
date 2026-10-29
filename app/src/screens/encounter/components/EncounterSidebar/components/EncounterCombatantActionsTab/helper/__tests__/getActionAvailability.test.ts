import { describe, it, expect } from 'vitest';
import { getActionAvailability } from '../getActionAvailability';

const READY = {
  amount: 5,
  hasHp: true,
  defeated: false,
  isRecording: false,
};

describe('getActionAvailability', () => {
  it('disables the four amount buttons and only those when there is no amount', () => {
    expect(getActionAvailability({ ...READY, amount: null })).toEqual({
      damage: false,
      heal: false,
      setTempHp: false,
      setMaxHp: false,
      markDefeated: true,
      unmarkDefeated: false,
      remove: true,
    });
  });

  it('disables Damage and Heal but not Set temp HP or Set max HP when HP is not set', () => {
    expect(getActionAvailability({ ...READY, hasHp: false })).toEqual({
      damage: false,
      heal: false,
      setTempHp: true,
      setMaxHp: true,
      markDefeated: true,
      unmarkDefeated: false,
      remove: true,
    });
  });

  it('flips Mark defeated and Unmark defeated with the defeated mark', () => {
    expect(getActionAvailability({ ...READY, defeated: true })).toMatchObject({
      markDefeated: false,
      unmarkDefeated: true,
    });
    expect(getActionAvailability(READY)).toMatchObject({
      markDefeated: true,
      unmarkDefeated: false,
    });
  });

  it('disables all seven buttons while a write is recording', () => {
    expect(
      Object.values(
        getActionAvailability({ ...READY, defeated: true, isRecording: true }),
      ),
    ).toEqual([false, false, false, false, false, false, false]);
    expect(
      Object.values(getActionAvailability({ ...READY, isRecording: true })),
    ).toEqual([false, false, false, false, false, false, false]);
  });
});
