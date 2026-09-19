// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { TableLayout } from '../layout-schema';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const layout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 250 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the config whose id is passed with its layout parsed, and null for an unknown id', async () => {
    const { create } = await import('../create');
    const { get } = await import('../get');
    const id = await create({
      table_name: 'custom',
      color: '1, 2, 3',
      layout,
      tagging_enabled: 0,
      scope: 'global',
    });

    expect(await get(id)).toEqual({
      id,
      table_name: 'custom',
      color: '1, 2, 3',
      tagging_enabled: 0,
      scope: 'global',
      layout,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    });
    expect(await get('missing-config')).toBeNull();
  });
});
