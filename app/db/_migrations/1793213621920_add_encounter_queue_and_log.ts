import type Database from '@tauri-apps/plugin-sql';
import type { Migration } from './index.ts';
import { ensureColumn } from '../util/index.ts';

// Frozen copy of what db/encounter-queue-item/schema.ts's createTableSQL produced when this migration was frozen, for the same reason the trigger SQL below is frozen — a migration must never depend on a live schema module (see app/db/CLAUDE.md — Migrations).
const CREATE_ENCOUNTER_QUEUE_ITEMS_SQL = `
  CREATE TABLE IF NOT EXISTS encounter_queue_items (
    id TEXT PRIMARY KEY,
    encounter_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    base_entity_id TEXT,
    name TEXT,
    custom_name TEXT,
    notes TEXT,
    sequence_number INTEGER,
    starting_max_hp INTEGER,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (base_entity_id) REFERENCES base_entities(id) ON DELETE SET NULL
  )
`;

// Frozen copy of what db/encounter-log-entry/schema.ts's createTableSQL produced when this migration was frozen, for the same reason as above.
const CREATE_ENCOUNTER_LOG_ENTRIES_SQL = `
  CREATE TABLE IF NOT EXISTS encounter_log_entries (
    id TEXT PRIMARY KEY,
    encounter_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE
  )
`;

const SYNCED_TABLE_NAMES = ['encounter_queue_items', 'encounter_log_entries'];

// Frozen local copy of buildTriggerSQL in 1784365870026_add_sync_infrastructure.ts — a migration must never depend on a shared helper, since a later edit to that helper would retroactively change this already-applied migration's behavior (see app/db/CLAUDE.md — Migrations).
const buildTriggerSQL = (
  tableName: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
): string => {
  if (event === 'DELETE') {
    // tableName is an element of SYNCED_TABLE_NAMES above, a module-local literal, at every call (app/db/CLAUDE.md — Conventions, "Values are always bound").
    return `
      CREATE TRIGGER IF NOT EXISTS trg_sync_${tableName}_delete AFTER DELETE ON ${tableName} BEGIN
        UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
        INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
          VALUES ('${tableName}:' || OLD.id, '${tableName}', OLD.id,
                  (SELECT value FROM _sync_meta WHERE id = 'seq'), 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
          ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
      END;
    `;
  }

  // tableName is an element of SYNCED_TABLE_NAMES above, a module-local literal, at every call, and event is the INSERT | UPDATE union its type declares (app/db/CLAUDE.md — Conventions, "Values are always bound").
  return `
    CREATE TRIGGER IF NOT EXISTS trg_sync_${tableName}_${event.toLowerCase()} AFTER ${event} ON ${tableName} BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('${tableName}:' || NEW.id, '${tableName}', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `;
};

const up = async (db: Database): Promise<void> => {
  await db.execute(CREATE_ENCOUNTER_QUEUE_ITEMS_SQL);
  await db.execute(CREATE_ENCOUNTER_LOG_ENTRIES_SQL);

  for (const tableName of SYNCED_TABLE_NAMES) {
    await db.execute(buildTriggerSQL(tableName, 'INSERT'));
    await db.execute(buildTriggerSQL(tableName, 'UPDATE'));
    await db.execute(buildTriggerSQL(tableName, 'DELETE'));
  }

  await ensureColumn(
    db,
    'encounters',
    'hide_defeated',
    'ALTER TABLE encounters ADD COLUMN hide_defeated INTEGER NOT NULL DEFAULT 0',
  );
};

export const addEncounterQueueAndLogMigration: Migration = {
  id: '1793213621920',
  up,
};
