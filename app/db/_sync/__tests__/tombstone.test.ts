// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const DELETED_AT = '2026-01-10T09:00:00.000Z';

describe('changeRecordId', () => {
  it('joins the table name and the row id with a colon, the id the sync triggers build', async () => {
    const { changeRecordId } = await import('../tombstone');

    expect(changeRecordId('adventures', 'abc')).toBe('adventures:abc');
  });
});

describe('getTombstoneDeletedAt', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const writeChange = async (
    id: string,
    tableName: string,
    rowId: string,
    deleted: number,
    deletedAt: string | null,
  ) => {
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) VALUES ($1, $2, $3, 1, $4, $5)',
      [id, tableName, rowId, deleted, deletedAt],
    );
  };

  const readDeletedAt = async (tableName: string, rowId: string) => {
    const { getDatabase } = await import('@db/database');
    const { getTombstoneDeletedAt } = await import('../tombstone');
    return getTombstoneDeletedAt(await getDatabase(), tableName, rowId);
  };

  it('returns the deletion time of the tombstone of the row in the table', async () => {
    await writeChange('adventures:a1', 'adventures', 'a1', 1, DELETED_AT);
    await writeChange(
      'sessions:a1',
      'sessions',
      'a1',
      1,
      '2026-02-02T00:00:00.000Z',
    );

    expect(await readDeletedAt('adventures', 'a1')).toBe(DELETED_AT);
    expect(await readDeletedAt('sessions', 'a1')).toBe(
      '2026-02-02T00:00:00.000Z',
    );
  });

  it('returns null for a row that was changed and not deleted, a row with no change record, and a tombstone of another table', async () => {
    await writeChange('adventures:alive', 'adventures', 'alive', 0, null);
    await writeChange('sessions:gone', 'sessions', 'gone', 1, DELETED_AT);

    expect(await readDeletedAt('adventures', 'alive')).toBeNull();
    expect(await readDeletedAt('adventures', 'unknown')).toBeNull();
    expect(await readDeletedAt('adventures', 'gone')).toBeNull();
  });

  it('returns null for a tombstone that carries no deletion time', async () => {
    await writeChange('adventures:old', 'adventures', 'old', 1, null);

    expect(await readDeletedAt('adventures', 'old')).toBeNull();
  });
});
