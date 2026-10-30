import { describe, expect, it } from 'vitest';
import { normalizeQueueItemName } from '../queueItemName';

describe('normalizeQueueItemName', () => {
  it('gives null for no name', () => {
    expect(normalizeQueueItemName(null)).toBeNull();
  });

  it.each([
    ['empty', ''],
    ['spaces-only', '   '],
  ])('gives null for an %s name', (_label, raw) => {
    expect(normalizeQueueItemName(raw)).toBeNull();
  });

  it('trims surrounding spaces and keeps interior ones', () => {
    expect(normalizeQueueItemName('  Big  Boss ')).toBe('Big  Boss');
  });
});
