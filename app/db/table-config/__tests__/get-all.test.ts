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

  it('returns each config with its stored columns and its layout parsed from the stored JSON', async () => {
    const { getAll } = await import('../get-all');
    const layout: TableLayout = {
      searchable_columns: ['name'],
      columns: [{ key: 'name', label: 'Name', width: 250 }],
      sort_state: { column: 'name', direction: 'desc' },
    };
    await insertTableConfig(layout);

    const configs = await getAll();

    expect(configs.find((config) => config.id === TABLE_CONFIG_ID)).toEqual({
      id: TABLE_CONFIG_ID,
      table_name: 'custom',
      color: '1, 2, 3',
      tagging_enabled: 1,
      scope: 'global',
      layout,
      created_at: TABLE_CONFIG_TIMESTAMP,
      updated_at: TABLE_CONFIG_TIMESTAMP,
    });
  });
});
