import { describe, expect, it } from 'vitest';
import {
  buildCombatantEntry,
  buildEventEntry,
} from '../../__tests__/support/buildQueueEntry';
import { isEventEntry } from '../isEventEntry';

describe('isEventEntry', () => {
  it('accepts an event entry and rejects a combatant entry and null', () => {
    expect(isEventEntry(buildEventEntry())).toBe(true);
    expect(isEventEntry(buildCombatantEntry())).toBe(false);
    expect(isEventEntry(null)).toBe(false);
  });
});
