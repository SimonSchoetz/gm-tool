// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TableLayout } from '../layout-schema';
import type { CreateTableConfigInput } from '../types';

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

const readConfigs = async (tableName: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<
    {
      id: string;
      table_name: string;
      color: string;
      tagging_enabled: number;
      scope: string;
      layout: string;
    }[]
  >('SELECT * FROM table_config WHERE table_name = $1', [tableName]);
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores a config with the database defaults and only the layout keys the layout schema defines', async () => {
    const { create } = await import('../create');

    const id = await create({
      table_name: 'custom',
      color: '1, 2, 3',
      layout: { ...layout, unknown_key: 'ignored' },
    } as unknown as CreateTableConfigInput);

    const [config] = await readConfigs('custom');
    expect(config).toMatchObject({
      id,
      color: '1, 2, 3',
      tagging_enabled: 1,
      scope: 'adventure',
    });
    expect(JSON.parse(config.layout)).toEqual(layout);
  });

  it('rejects a config for a table that already has one', async () => {
    const { create } = await import('../create');

    await expect(
      create({ table_name: 'npcs', color: '1, 2, 3', layout }),
    ).rejects.toThrow('UNIQUE constraint failed');
  });

  it('rejects a layout with a null column width and stores no row', async () => {
    const { create } = await import('../create');

    await expect(
      create({
        table_name: 'custom',
        color: '1, 2, 3',
        layout: {
          ...layout,
          columns: [{ key: 'name', label: 'Name', width: null }],
        },
      } as unknown as CreateTableConfigInput),
    ).rejects.toThrow(/^Invalid layout/);

    expect(await readConfigs('custom')).toEqual([]);
  });
});
