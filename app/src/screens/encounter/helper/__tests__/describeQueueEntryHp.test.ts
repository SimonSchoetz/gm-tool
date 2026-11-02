import { describe, it, expect } from 'vitest';
import { describeQueueEntryHp } from '../describeQueueEntryHp';

describe('describeQueueEntryHp', () => {
  it.each([
    { maxHp: null, currentHp: null },
    { maxHp: 7, currentHp: null },
    { maxHp: null, currentHp: 7 },
  ])('gives null for an unset HP %j', (hp) => {
    expect(describeQueueEntryHp({ ...hp, tempHp: 0 })).toBeNull();
  });

  it('writes current and max HP, and the temp HP only when it is above 0', () => {
    expect(
      describeQueueEntryHp({ maxHp: 7, currentHp: 4, tempHp: 2 })?.text,
    ).toBe('4/7 +2');
    expect(
      describeQueueEntryHp({ maxHp: 7, currentHp: 4, tempHp: 0 })?.text,
    ).toBe('4/7');
  });

  it('computes the lost share of a hurt entry from max and current HP and ignores temp HP', () => {
    expect(describeQueueEntryHp({ maxHp: 8, currentHp: 6, tempHp: 5 })).toEqual(
      {
        text: '6/8 +5',
        state: 'hurt',
        lostShare: 0.25,
      },
    );
  });

  it.each([
    { maxHp: 7, currentHp: 0 },
    { maxHp: 7, currentHp: -2 },
    { maxHp: 0, currentHp: 0 },
    { maxHp: 0, currentHp: 3 },
    { maxHp: -3, currentHp: 2 },
  ])('is down with a full lost share for %j', (hp) => {
    expect(describeQueueEntryHp({ ...hp, tempHp: 0 })).toMatchObject({
      state: 'down',
      lostShare: 1,
    });
  });

  it('is ok with no lost share at full HP', () => {
    expect(describeQueueEntryHp({ maxHp: 7, currentHp: 7, tempHp: 0 })).toEqual(
      {
        text: '7/7',
        state: 'ok',
        lostShare: 0,
      },
    );
  });
});
