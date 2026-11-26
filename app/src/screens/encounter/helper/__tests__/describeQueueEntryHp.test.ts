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

  it('writes current and max HP without the temp HP', () => {
    expect(
      describeQueueEntryHp({ maxHp: 7, currentHp: 4, tempHp: 2 })?.text,
    ).toBe('4/7');
  });

  it('computes the lost share of a hurt entry from max and current HP and ignores temp HP', () => {
    expect(describeQueueEntryHp({ maxHp: 8, currentHp: 6, tempHp: 5 })).toEqual(
      {
        text: '6/8',
        state: 'hurt',
        lostShare: 0.25,
        tempHp: 5,
        tempShare: 0.625,
      },
    );
  });

  it.each([
    { maxHp: 7, currentHp: 7 },
    { maxHp: 7, currentHp: 0 },
  ])('hands the temp HP through for %j', (hp) => {
    expect(describeQueueEntryHp({ ...hp, tempHp: 3 })?.tempHp).toBe(3);
  });

  it.each([
    { maxHp: 8, tempHp: 0, tempShare: 0 },
    { maxHp: 0, tempHp: 0, tempShare: 0 },
    { maxHp: 8, tempHp: 2, tempShare: 0.25 },
    { maxHp: 8, tempHp: 8, tempShare: 1 },
    { maxHp: 8, tempHp: 20, tempShare: 1 },
    { maxHp: 0, tempHp: 3, tempShare: 1 },
    { maxHp: -3, tempHp: 3, tempShare: 1 },
  ])(
    'gives a temp share of $tempShare for $tempHp temp HP on max HP $maxHp',
    ({ maxHp, tempHp, tempShare }) => {
      expect(
        describeQueueEntryHp({ maxHp, currentHp: 4, tempHp })?.tempShare,
      ).toBe(tempShare);
    },
  );

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
        tempHp: 0,
        tempShare: 0,
      },
    );
  });
});
