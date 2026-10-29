import { describe, it, expect } from 'vitest';
import {
  isRevertibleLogEntryKind,
  readLogEntry,
  serializeLogEntryPayload,
} from '../logEntryPayloads';

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

describe('serializeLogEntryPayload for message and revert', () => {
  it('serializes a message and a revert to the JSON string of exactly their fields', () => {
    expect(serializeLogEntryPayload('message', { editorState: 'state' })).toBe(
      '{"editorState":"state"}',
    );
    expect(serializeLogEntryPayload('revert', { entryId: 'entry-1' })).toBe(
      '{"entryId":"entry-1"}',
    );
  });

  it('rejects an empty editor state and an empty entry id', () => {
    expect(() =>
      serializeLogEntryPayload('message', { editorState: '' }),
    ).toThrow();
    expect(() => serializeLogEntryPayload('revert', { entryId: '' })).toThrow();
  });
});

describe('isRevertibleLogEntryKind', () => {
  it.each([
    'damage',
    'heal',
    'temp-hp',
    'max-hp',
    'defeated',
    'undefeated',
    'removed',
  ])('accepts %s', (kind) => {
    expect(isRevertibleLogEntryKind(kind)).toBe(true);
  });

  it.each(['added', 'message', 'revert', 'unknown', 'constructor'])(
    'rejects %s',
    (kind) => {
      expect(isRevertibleLogEntryKind(kind)).toBe(false);
    },
  );
});

describe('readLogEntry', () => {
  it.each([
    ['damage', 'amount'],
    ['heal', 'amount'],
    ['temp-hp', 'value'],
    ['max-hp', 'value'],
  ])('accepts a %s payload with several targets', (kind, field) => {
    const payload = {
      targets: [
        { queueItemId: 'a', [field]: 1 },
        { queueItemId: 'b', [field]: 2 },
      ],
    };

    expect(readLogEntry(kind, JSON.stringify(payload))).toEqual({
      kind,
      payload,
    });
  });

  it.each([
    ['damage', { targets: [{ queueItemId: 'a', amount: 3 }] }],
    ['heal', { targets: [{ queueItemId: 'a', amount: 3 }] }],
    ['temp-hp', { targets: [{ queueItemId: 'a', value: 3 }] }],
    ['max-hp', { targets: [{ queueItemId: 'a', value: 3 }] }],
    ['defeated', { queueItemIds: ['a'] }],
    ['undefeated', { queueItemIds: ['a'] }],
    ['removed', { queueItemIds: ['a'] }],
    ['message', { editorState: '{"root":{}}' }],
    ['revert', { entryId: 'entry-1' }],
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
    ['an empty editor state', 'message', '{"editorState":""}'],
    ['an empty entry id', 'revert', '{"entryId":""}'],
    [
      'the field of another kind',
      'max-hp',
      '{"targets":[{"queueItemId":"a","amount":3}]}',
    ],
  ])('returns null for %s', (_label, kind, payload) => {
    expect(readLogEntry(kind, payload)).toBeNull();
  });
});
