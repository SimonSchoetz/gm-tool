// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyMigrationsBefore,
  openTestDatabase,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { addBaseEntitiesMigration } from '../1789304154994_add_base_entities';

const LEGACY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items'];
const LEGACY_TABLE_PLACEHOLDERS = LEGACY_TABLES.map(
  (_table, index) => `$${index + 1}`,
).join(', ');
const ADVENTURE_ID = 'adventure-1';
const IMAGE_ID = 'image-1';
const SEEDED_AT = '2026-01-01T00:00:00.000Z';
const TOMBSTONE_ROW_ID = 'npcs-deleted';
// A delete trigger stamps SQLite's own clock, which fake timers cannot reach, so the seed overwrites the tombstone's `deleted_at` with this fixed value.
const TOMBSTONE_DELETED_AT = '2026-04-01T00:00:00.000Z';

type Row = Record<string, string | number | null>;

const insertRow = (db: TestDatabase, table: string, row: Row) => {
  const columns = Object.keys(row);
  const placeholders = columns.map((_column, index) => `$${index + 1}`);
  return db.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
    Object.values(row),
  );
};

// Every value differs per table, so a column copied into the wrong position shows.
const legacyRow = (table: string, index: number) => ({
  id: `${table}-1`,
  adventure_id: ADVENTURE_ID,
  name: `${table} name`,
  summary: `${table} summary`,
  description: `${table} description`,
  image_id: IMAGE_ID,
  pinned_order: index + 1,
  created_at: `2026-02-0${index + 1}T00:00:00.000Z`,
  updated_at: `2026-03-0${index + 1}T00:00:00.000Z`,
});

const seedLegacyDatabase = async (): Promise<TestDatabase> => {
  const db = openTestDatabase();
  await applyMigrationsBefore(db, addBaseEntitiesMigration.id);
  await insertRow(db, 'adventures', {
    id: ADVENTURE_ID,
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  });
  await insertRow(db, 'images', {
    id: IMAGE_ID,
    file_extension: 'png',
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  });
  for (const [index, table] of LEGACY_TABLES.entries()) {
    await insertRow(db, table, legacyRow(table, index));
  }
  // Inserting and deleting an extra row makes the legacy delete trigger write a tombstone.
  await insertRow(db, 'npcs', {
    id: TOMBSTONE_ROW_ID,
    adventure_id: ADVENTURE_ID,
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  });
  await db.execute('DELETE FROM npcs WHERE id = $1', [TOMBSTONE_ROW_ID]);
  await db.execute('UPDATE _sync_changes SET deleted_at = $1 WHERE id = $2', [
    TOMBSTONE_DELETED_AT,
    `npcs:${TOMBSTONE_ROW_ID}`,
  ]);
  return db;
};

// `table_config` ids, timestamps and change rows are left out: the seed migration gives every fresh database random ids and wall-clock timestamps.
const snapshot = async (db: TestDatabase) => ({
  baseEntities: await db.select<unknown[]>(
    'SELECT * FROM base_entities ORDER BY id',
  ),
  changes: await db.select<unknown[]>(
    "SELECT * FROM _sync_changes WHERE table_name != 'table_config' ORDER BY id",
  ),
  syncSeq: await db.select<unknown[]>(
    "SELECT value FROM _sync_meta WHERE id = 'seq'",
  ),
  schemaNames: await db.select<unknown[]>(
    'SELECT name FROM sqlite_master ORDER BY name',
  ),
});

describe('addBaseEntitiesMigration.up', () => {
  it('copies every legacy row into base_entities with its entity type and every column unchanged', async () => {
    const db = await seedLegacyDatabase();

    await addBaseEntitiesMigration.up(db);

    const rows = await db.select<unknown[]>(
      'SELECT * FROM base_entities ORDER BY id',
    );
    expect(rows).toHaveLength(LEGACY_TABLES.length);
    for (const [index, table] of LEGACY_TABLES.entries()) {
      expect(rows).toContainEqual({
        ...legacyRow(table, index),
        entity_type: table,
      });
    }
  });

  it('drops the legacy tables, clears their change records and gives every copied row a live base_entities change record', async () => {
    const db = await seedLegacyDatabase();

    await addBaseEntitiesMigration.up(db);

    expect(
      await db.select<unknown[]>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${LEGACY_TABLE_PLACEHOLDERS})`,
        LEGACY_TABLES,
      ),
    ).toEqual([]);
    expect(
      await db.select<unknown[]>(
        `SELECT id FROM _sync_changes WHERE table_name IN (${LEGACY_TABLE_PLACEHOLDERS})`,
        LEGACY_TABLES,
      ),
    ).toEqual([]);
    const liveChanges = await db.select<{ id: string }[]>(
      "SELECT id FROM _sync_changes WHERE table_name = 'base_entities' AND deleted = 0",
    );
    expect(liveChanges.map((change) => change.id).sort()).toEqual(
      LEGACY_TABLES.map((table) => `base_entities:${table}-1`).sort(),
    );
  });

  it('keeps a legacy tombstone under its base_entities id with its deleted_at and original seq', async () => {
    const db = await seedLegacyDatabase();
    const [legacyChange] = await db.select<{ seq: number }[]>(
      'SELECT seq FROM _sync_changes WHERE id = $1',
      [`npcs:${TOMBSTONE_ROW_ID}`],
    );

    await addBaseEntitiesMigration.up(db);

    expect(
      await db.select<unknown[]>(
        'SELECT deleted, deleted_at, seq FROM _sync_changes WHERE id = $1',
        [`base_entities:${TOMBSTONE_ROW_ID}`],
      ),
    ).toEqual([
      { deleted: 1, deleted_at: TOMBSTONE_DELETED_AT, seq: legacyChange.seq },
    ]);
  });

  it('leaves the snapshot unchanged when run a second time on the migrated database', async () => {
    const db = await seedLegacyDatabase();
    await addBaseEntitiesMigration.up(db);
    const migrated = await snapshot(db);

    await addBaseEntitiesMigration.up(db);

    expect(await snapshot(db)).toEqual(migrated);
  });

  it('ends in the clean run snapshot when interrupted before any one statement and run again', async () => {
    const cleanDb = await seedLegacyDatabase();
    const callsBeforeUp = cleanDb.callCount();
    await addBaseEntitiesMigration.up(cleanDb);
    const statementCount = cleanDb.callCount() - callsBeforeUp;
    const cleanSnapshot = await snapshot(cleanDb);

    for (let call = 1; call <= statementCount; call++) {
      const db = await seedLegacyDatabase();
      db.failOnCall(db.callCount() + call);
      await expect(addBaseEntitiesMigration.up(db)).rejects.toThrow(
        'Injected failure',
      );

      await addBaseEntitiesMigration.up(db);

      expect(
        await snapshot(db),
        `interrupted before statement ${call}`,
      ).toEqual(cleanSnapshot);
    }
  });
});
