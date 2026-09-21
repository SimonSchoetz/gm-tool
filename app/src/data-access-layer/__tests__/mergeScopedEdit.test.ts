import { describe, expect, it } from 'vitest';

import { mergeScopedEdit } from '../mergeScopedEdit';

type Edit = {
  adventureId: string;
  data: { name?: string; description?: string };
};

describe('mergeScopedEdit', () => {
  it('takes every field but data from the later edit', () => {
    const merged = mergeScopedEdit<Edit>(
      { adventureId: 'adventure-a', data: { name: 'x' } },
      { adventureId: 'adventure-b', data: {} },
    );

    expect(merged.adventureId).toBe('adventure-b');
  });

  it('merges the data of both edits, the later value winning per key', () => {
    const merged = mergeScopedEdit<Edit>(
      { adventureId: 'adventure-a', data: { name: 'x', description: 'd' } },
      { adventureId: 'adventure-a', data: { name: 'y' } },
    );

    expect(merged.data).toEqual({ name: 'y', description: 'd' });
  });
});
