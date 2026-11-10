// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TableLayout } from '../layout-schema';
import type { UpdateTableConfigInput } from '../types';
import {
  insertTableConfig,
  TABLE_CONFIG_ID,
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

const newLayout: TableLayout = {
  searchable_columns: ['name', 'description'],
  columns: [{ key: 'description', label: 'Description', width: 300 }],
  sort_state: { column: 'description', direction: 'desc' },
};

const readRow = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const [row] = await db.select<{ tagging_enabled: number; layout: string }[]>(
    'SELECT * FROM table_config WHERE id = $1',
    [id],
  );
  return { taggingEnabled: row.tagging_enabled, layout: row.layout };
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes tagging_enabled 0 over 1 and rejects a value above 1, leaving the row unchanged', async () => {
    const { update } = await import('../update');
    await insertTableConfig(layout);
    expect((await readRow(TABLE_CONFIG_ID)).taggingEnabled).toBe(1);

    await update(TABLE_CONFIG_ID, { tagging_enabled: 0 });
    expect((await readRow(TABLE_CONFIG_ID)).taggingEnabled).toBe(0);

    await expect(
      update(TABLE_CONFIG_ID, { tagging_enabled: 2 }),
    ).rejects.toThrow();
    expect((await readRow(TABLE_CONFIG_ID)).taggingEnabled).toBe(0);
  });

  it('stores a new valid layout without its unknown keys and rejects an invalid one, leaving the stored layout unchanged', async () => {
    const { update } = await import('../update');
    await insertTableConfig(layout);

    await update(TABLE_CONFIG_ID, {
      layout: { ...newLayout, unknown_key: 'ignored' },
    } as unknown as UpdateTableConfigInput);
    expect(JSON.parse((await readRow(TABLE_CONFIG_ID)).layout)).toEqual(
      newLayout,
    );

    await expect(
      update(TABLE_CONFIG_ID, {
        layout: {
          ...layout,
          columns: [{ key: 'name', label: 'Name', width: null }],
        },
      } as unknown as UpdateTableConfigInput),
    ).rejects.toThrow(/^Invalid layout: \[[\s\S]*\]$/);
    expect(JSON.parse((await readRow(TABLE_CONFIG_ID)).layout)).toEqual(
      newLayout,
    );
  });
});

describe('update input guards', () => {
  it('rejects a blank id, naming table config in its message', async () => {
    const { update } = await import('../update');

    await expect(update('', { color: '#000000' })).rejects.toThrow(
      /^Valid table config ID is required$/,
    );
  });

  it('rejects an update that carries no field', async () => {
    const { update } = await import('../update');

    await expect(update('config-1', {})).rejects.toThrow(
      /^At least one field must be provided for update$/,
    );
  });
});
