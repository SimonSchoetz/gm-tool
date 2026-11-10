// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const write = async (key: string, value: string | null) => {
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute(
      'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
      [key, value],
    );
  };

  it('returns the value stored under the key, and not the value of another key', async () => {
    const { get } = await import('../get');
    await write('first', 'one');
    await write('second', 'two');

    expect(await get('first')).toBe('one');
    expect(await get('second')).toBe('two');
  });

  it('returns null for a key with no row, and for a row whose value is NULL', async () => {
    const { get } = await import('../get');
    await write('empty', null);

    expect(await get('missing')).toBeNull();
    expect(await get('empty')).toBeNull();
  });
});
