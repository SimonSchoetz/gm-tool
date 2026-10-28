import { describe, it, expect } from 'vitest';
import { serializeLogEntryPayload } from '../logEntryPayloads';

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
});
