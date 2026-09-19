// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getAll', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the nine seeded configs ordered by table name', async () => {
    const { getAll } = await import('../get-all');

    const tableNames = (await getAll()).map((config) => config.table_name);

    expect(tableNames).toHaveLength(9);
    expect(tableNames).toEqual([...tableNames].sort());
  });
});
