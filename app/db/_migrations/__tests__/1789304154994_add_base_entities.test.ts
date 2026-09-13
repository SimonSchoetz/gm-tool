import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addBaseEntitiesMigration } from '../1789304154994_add_base_entities';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

const mockDb = {
  execute: mockExecute,
  select: mockSelect,
} as unknown as Parameters<typeof addBaseEntitiesMigration.up>[0];

const LEGACY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items'];

const EXISTENCE_SQL =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1";

const copySql = (table: string): string =>
  `INSERT INTO base_entities (id, adventure_id, entity_type, name, summary, description, image_id, pinned_order, created_at, updated_at) SELECT id, adventure_id, $1, name, summary, description, image_id, pinned_order, created_at, updated_at FROM ${table} WHERE true ON CONFLICT(id) DO NOTHING`;

const TOMBSTONE_SQL =
  "INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) SELECT 'base_entities:' || row_id, 'base_entities', row_id, seq, deleted, deleted_at FROM _sync_changes WHERE table_name = $1 AND deleted = 1 ON CONFLICT(id) DO NOTHING";

const CLEANUP_SQL = 'DELETE FROM _sync_changes WHERE table_name = $1';

type ExecuteCall = [string, unknown[]?];

// TOMBSTONE_SQL and CLEANUP_SQL are identical for every table and differ only in the bound table name, so finding "the call for table X" needs both the SQL text and the first bound value.
const findCallIndex = (sql: string, tableValue?: string): number =>
  (mockExecute.mock.calls as ExecuteCall[]).findIndex(([callSql, values]) => {
    if (callSql !== sql) return false;
    if (tableValue === undefined) return true;
    return Array.isArray(values) && values[0] === tableValue;
  });

describe('addBaseEntitiesMigration.up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
  });

  it('creates base_entities and its three sync triggers before copying any row', async () => {
    mockSelect.mockResolvedValue([{ name: 'present' }]);

    await addBaseEntitiesMigration.up(mockDb);

    const calls = mockExecute.mock.calls as ExecuteCall[];
    expect(calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS base_entities');
    expect(calls[1][0]).toContain(
      'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_insert',
    );
    expect(calls[2][0]).toContain(
      'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_update',
    );
    expect(calls[3][0]).toContain(
      'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_delete',
    );

    const copyCallIndexes = calls
      .map((call, index) => ({ sql: call[0], index }))
      .filter(({ sql }) => sql.startsWith('INSERT INTO base_entities'))
      .map(({ index }) => index);
    expect(copyCallIndexes.length).toBe(LEGACY_TABLES.length);
    for (const index of copyCallIndexes) {
      expect(index).toBeGreaterThan(3);
    }
  });

  it('checks each legacy table for existence in sqlite_master, in order', async () => {
    mockSelect.mockResolvedValue([{ name: 'present' }]);

    await addBaseEntitiesMigration.up(mockDb);

    expect(mockSelect).toHaveBeenCalledTimes(6);
    LEGACY_TABLES.forEach((table, index) => {
      expect(mockSelect).toHaveBeenNthCalledWith(index + 1, EXISTENCE_SQL, [
        table,
      ]);
    });
  });

  it('copies every legacy table that still exists and still re-keys, drops, and cleans it up', async () => {
    mockSelect.mockResolvedValue([{ name: 'present' }]);

    await addBaseEntitiesMigration.up(mockDb);

    for (const table of LEGACY_TABLES) {
      expect(mockExecute).toHaveBeenCalledWith(copySql(table), [table]);
      expect(mockExecute).toHaveBeenCalledWith(TOMBSTONE_SQL, [table]);
      expect(mockExecute).toHaveBeenCalledWith(`DROP TABLE IF EXISTS ${table}`);
      expect(mockExecute).toHaveBeenCalledWith(CLEANUP_SQL, [table]);
    }
  });

  it('skips the copy for an already-dropped legacy table but still re-keys its tombstones, drops it, and cleans up', async () => {
    mockSelect.mockImplementation((_query: string, values: string[]) =>
      Promise.resolve(values[0] === 'npcs' ? [] : [{ name: values[0] }]),
    );

    await addBaseEntitiesMigration.up(mockDb);

    expect(mockExecute).not.toHaveBeenCalledWith(copySql('npcs'), ['npcs']);
    expect(mockExecute).toHaveBeenCalledWith(TOMBSTONE_SQL, ['npcs']);
    expect(mockExecute).toHaveBeenCalledWith('DROP TABLE IF EXISTS npcs');
    expect(mockExecute).toHaveBeenCalledWith(CLEANUP_SQL, ['npcs']);

    expect(mockExecute).toHaveBeenCalledWith(copySql('pcs'), ['pcs']);
  });

  it('runs copy, tombstone re-key, drop, and cleanup in that order within a table', async () => {
    mockSelect.mockResolvedValue([{ name: 'present' }]);

    await addBaseEntitiesMigration.up(mockDb);

    const copyIndex = findCallIndex(copySql('factions'), 'factions');
    const tombstoneIndex = findCallIndex(TOMBSTONE_SQL, 'factions');
    const dropIndex = findCallIndex('DROP TABLE IF EXISTS factions');
    const cleanupIndex = findCallIndex(CLEANUP_SQL, 'factions');

    expect(copyIndex).toBeLessThan(tombstoneIndex);
    expect(tombstoneIndex).toBeLessThan(dropIndex);
    expect(dropIndex).toBeLessThan(cleanupIndex);
  });
});
