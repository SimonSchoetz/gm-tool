import { describe, it, expect } from 'vitest';
import { readLogEntry, serializeLogEntryPayload } from '../logEntryPayloads';

describe('serializeLogEntryPayload', () => {
  it('serializes a valid added payload to the JSON string of exactly its fields', () => {
    expect(
      serializeLogEntryPayload('added', { queueItemIds: ['a', 'b'] }),
    ).toBe('{"queueItemIds":["a","b"]}');
  });

  it('rejects an empty queueItemIds list', () => {
    expect(() =>
      serializeLogEntryPayload('added', { queueItemIds: [] }),
    ).toThrow();
  });

  it('rejects a non-string queue item id', () => {
    expect(() =>
      serializeLogEntryPayload('added', {
        queueItemIds: [1] as unknown as string[],
      }),
    ).toThrow();
  });

  it.each([-1, 1.5])('rejects a damage amount of %s', (amount) => {
    expect(() =>
      serializeLogEntryPayload('damage', {
        targets: [{ queueItemId: 'a', amount }],
      }),
    ).toThrow();
  });

  it('rejects a temp-hp payload that carries amount in place of value', () => {
    expect(() =>
      serializeLogEntryPayload('temp-hp', {
        targets: [{ queueItemId: 'a', amount: 3 }] as unknown as {
          queueItemId: string;
          value: number;
        }[],
      }),
    ).toThrow();
  });

  it('rejects an empty targets list', () => {
    expect(() => serializeLogEntryPayload('heal', { targets: [] })).toThrow();
  });
});

describe('readLogEntry', () => {
  it.each([
    ['damage', { targets: [{ queueItemId: 'a', amount: 3 }] }],
    ['heal', { targets: [{ queueItemId: 'a', amount: 3 }] }],
    ['temp-hp', { targets: [{ queueItemId: 'a', value: 3 }] }],
    ['max-hp', { targets: [{ queueItemId: 'a', value: 3 }] }],
    ['defeated', { queueItemIds: ['a'] }],
    ['undefeated', { queueItemIds: ['a'] }],
    ['removed', { queueItemIds: ['a'] }],
  ])('returns the kind and the payload of a %s entry', (kind, payload) => {
    expect(readLogEntry(kind, JSON.stringify(payload))).toEqual({
      kind,
      payload,
    });
  });

  it.each([
    ['an inherited name', 'constructor', '{"queueItemIds":["a"]}'],
    ['invalid JSON', 'removed', '{not json'],
    [
      'a negative number',
      'damage',
      '{"targets":[{"queueItemId":"a","amount":-1}]}',
    ],
    [
      'a fractional number',
      'heal',
      '{"targets":[{"queueItemId":"a","amount":1.5}]}',
    ],
    ['an empty list', 'defeated', '{"queueItemIds":[]}'],
    [
      'the field of another kind',
      'max-hp',
      '{"targets":[{"queueItemId":"a","amount":3}]}',
    ],
  ])('returns null for %s', (_label, kind, payload) => {
    expect(readLogEntry(kind, payload)).toBeNull();
  });
});
