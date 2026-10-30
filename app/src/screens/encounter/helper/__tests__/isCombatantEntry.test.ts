import { describe, expect, it } from 'vitest';
import {
  buildCombatantEntry,
  buildEventEntry,
} from '../../__tests__/support/buildQueueEntry';
import { isCombatantEntry } from '../isCombatantEntry';

describe('isCombatantEntry', () => {
  it('accepts a combatant entry and rejects an event entry and null', () => {
    expect(isCombatantEntry(buildCombatantEntry())).toBe(true);
    expect(isCombatantEntry(buildEventEntry())).toBe(false);
    expect(isCombatantEntry(null)).toBe(false);
  });
});
