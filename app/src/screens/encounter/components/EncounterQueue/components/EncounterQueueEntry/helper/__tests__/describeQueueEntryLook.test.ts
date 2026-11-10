import { describe, expect, it } from 'vitest';
import { describeQueueEntryLook } from '../describeQueueEntryLook';

describe('describeQueueEntryLook', () => {
  it('has no HP and a plain image for an event', () => {
    expect(describeQueueEntryLook({ kind: 'event' })).toEqual({
      hp: null,
      imageLook: 'plain',
    });
  });

  it('describes a combatant by its HP and defeated flag', () => {
    expect(
      describeQueueEntryLook({
        kind: 'combatant',
        maxHp: 10,
        currentHp: 4,
        tempHp: 0,
        defeated: false,
      }),
    ).toEqual({
      hp: { text: '4/10', state: 'hurt', lostShare: 0.6 },
      imageLook: 'tint',
    });
    expect(
      describeQueueEntryLook({
        kind: 'combatant',
        maxHp: 10,
        currentHp: 4,
        tempHp: 0,
        defeated: true,
      }).imageLook,
    ).toBe('grey');
  });
});
