import { describe, it, expect, vi } from 'vitest';
import type Database from '@tauri-apps/plugin-sql';
import { ensureColumn } from '../ensure-column';

const buildMockDb = (existingColumns: string[]) => {
  const select = vi
    .fn()
    .mockResolvedValue(existingColumns.map((name) => ({ name })));
  const execute = vi.fn().mockResolvedValue(undefined);
  return { select, execute, db: { select, execute } as unknown as Database };
};

describe('ensureColumn', () => {
  it('runs the ALTER statement when the column is missing', async () => {
    const { db, select, execute } = buildMockDb(['id', 'name']);

    await ensureColumn(
      db,
      'npcs',
      'pinned_order',
      'ALTER TABLE npcs ADD COLUMN pinned_order INTEGER',
    );

    expect(select).toHaveBeenCalledWith('PRAGMA table_info(npcs)');
    expect(execute).toHaveBeenCalledWith(
      'ALTER TABLE npcs ADD COLUMN pinned_order INTEGER',
    );
  });

  it('skips the ALTER statement when the column already exists', async () => {
    const { db, execute } = buildMockDb(['id', 'name', 'pinned_order']);

    await ensureColumn(
      db,
      'npcs',
      'pinned_order',
      'ALTER TABLE npcs ADD COLUMN pinned_order INTEGER',
    );

    expect(execute).not.toHaveBeenCalled();
  });
});
