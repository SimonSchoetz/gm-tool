// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TableLayout } from '../layout-schema';
import {
  insertTableConfig,
  TABLE_CONFIG_ID,
  TABLE_CONFIG_TIMESTAMP,
} from './support/insertTableConfig';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const layout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 250 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the config whose id is passed with its layout parsed, and null for an unknown id', async () => {
    const { get } = await import('../get');
    await insertTableConfig(layout);

    expect(await get(TABLE_CONFIG_ID)).toEqual({
      id: TABLE_CONFIG_ID,
      table_name: 'custom',
      color: '1, 2, 3',
      tagging_enabled: 1,
      scope: 'global',
      layout,
      created_at: TABLE_CONFIG_TIMESTAMP,
      updated_at: TABLE_CONFIG_TIMESTAMP,
    });
    expect(await get('missing-config')).toBeNull();
  });
});

describe('get input guards', () => {
  it('rejects a blank id, naming table config in its message', async () => {
    const { get } = await import('../get');

    await expect(get('')).rejects.toThrow(
      /^Valid table config ID is required$/,
    );
  });
});
