import type Database from '@tauri-apps/plugin-sql';

// A frozen copy of what db/base-entity/schema.ts's createTableSQL generates — a migration must never depend on a live schema module (see app/db/CLAUDE.md — Migrations).
const CREATE_BASE_ENTITIES_SQL = `
  CREATE TABLE IF NOT EXISTS base_entities (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    name TEXT,
    summary TEXT,
    description TEXT,
    image_id TEXT,
    pinned_order INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
  )
`;

// A frozen copy of the entity types domain/entities/entityTypes.ts's BASE_ENTITY_TYPES holds — each is also the legacy table whose rows move into base_entities (see app/db/CLAUDE.md — Migrations).
const LEGACY_BASE_ENTITY_TABLES = [
  'npcs',
  'pcs',
  'foes',
  'factions',
  'locations',
  'items',
];

const up = async (db: Database): Promise<void> => {
  await db.execute(CREATE_BASE_ENTITIES_SQL);

  // The sync triggers are created before any row is copied so every copied row (inserted below) gets a base_entities change record — the legacy tables' own change records are deleted by the per-table _sync_changes cleanup at the end of the loop below, and a row with no change record never reaches a paired device.
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_insert AFTER INSERT ON base_entities BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entities:' || NEW.id, 'base_entities', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `);
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_update AFTER UPDATE ON base_entities BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entities:' || NEW.id, 'base_entities', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `);
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_delete AFTER DELETE ON base_entities BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entities:' || OLD.id, 'base_entities', OLD.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
    END;
  `);

  // table is interpolated into the copy INSERT and the DROP TABLE statement inside this loop because SQL does not support parameterized table names; it only ever comes from the fixed LEGACY_BASE_ENTITY_TABLES constant above, never from user input (mirrors backfill_sync_changes.ts).
  for (const table of LEGACY_BASE_ENTITY_TABLES) {
    // The sqlite_master guard keeps a resumed run from selecting a table an earlier attempt already dropped (by the DROP TABLE statement below).
    const existing = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1",
      [table],
    );

    if (existing.length > 0) {
      // WHERE true disambiguates the upsert clause for SQLite's parser.
      await db.execute(
        `INSERT INTO base_entities (id, adventure_id, entity_type, name, summary, description, image_id, pinned_order, created_at, updated_at) SELECT id, adventure_id, $1, name, summary, description, image_id, pinned_order, created_at, updated_at FROM ${table} WHERE true ON CONFLICT(id) DO NOTHING`,
        [table],
      );
    }

    // Tombstones keep their original seq so a peer that had not yet received the deletion still receives it under the base_entities id. Runs unconditionally (not gated on the guard above) since it reads only _sync_changes, which always exists, and must still complete on a resumed run where the legacy table was already dropped by an earlier attempt.
    await db.execute(
      `INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) SELECT 'base_entities:' || row_id, 'base_entities', row_id, seq, deleted, deleted_at FROM _sync_changes WHERE table_name = $1 AND deleted = 1 ON CONFLICT(id) DO NOTHING`,
      [table],
    );

    // The drop precedes the _sync_changes cleanup below so no change record the drop could emit survives.
    await db.execute(`DROP TABLE IF EXISTS ${table}`);

    await db.execute('DELETE FROM _sync_changes WHERE table_name = $1', [
      table,
    ]);
  }
};

export const addBaseEntitiesMigration = {
  id: '1789304154994',
  up,
};
