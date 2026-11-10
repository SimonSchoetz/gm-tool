// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const read = async (key: string) => {
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    return db.select<{ id: string; value: string | null }[]>(
      'SELECT id, value FROM _system WHERE id = $1',
      [key],
    );
  };

  it('stores the value under the key, and replaces the value of a key that has one', async () => {
    const { update } = await import('../update');

    await update('key', 'first');

    expect(await read('key')).toEqual([{ id: 'key', value: 'first' }]);

    await update('key', 'second');

    expect(await read('key')).toEqual([{ id: 'key', value: 'second' }]);
  });

  it('stores NULL as the value, and leaves the rows of other keys alone', async () => {
    const { update } = await import('../update');
    await update('other', 'kept');

    await update('key', null);

    expect(await read('key')).toEqual([{ id: 'key', value: null }]);
    expect(await read('other')).toEqual([{ id: 'other', value: 'kept' }]);
  });
});
