import { describe, it, expect } from 'vitest';
import { describeQueueEntryHp } from '../../../../../../helper/describeQueueEntryHp';
import { describeQueueEntryImage } from '../describeQueueEntryImage';

describe('describeQueueEntryImage', () => {
  const hpOf = (maxHp: number | null, currentHp: number | null) =>
    describeQueueEntryHp({ maxHp, currentHp, tempHp: 0 });

  it('is grey for a defeated combatant at hurt HP, not tinted', () => {
    expect(describeQueueEntryImage(hpOf(10, 4), true)).toBe('grey');
  });

  it('is grey for a defeated combatant whose HP is not set', () => {
    expect(describeQueueEntryImage(hpOf(null, null), true)).toBe('grey');
  });

  it('is tinted when hurt and not defeated, and grey when down and not defeated', () => {
    expect(describeQueueEntryImage(hpOf(10, 4), false)).toBe('tint');
    expect(describeQueueEntryImage(hpOf(10, 0), false)).toBe('grey');
  });

  it('is plain at full HP or with no HP set when not defeated', () => {
    expect(describeQueueEntryImage(hpOf(10, 10), false)).toBe('plain');
    expect(describeQueueEntryImage(hpOf(null, null), false)).toBe('plain');
  });
});
