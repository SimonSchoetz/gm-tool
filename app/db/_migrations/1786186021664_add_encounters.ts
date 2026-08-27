import type Database from '@tauri-apps/plugin-sql';
import { encounterTable } from '../encounter/schema';
import { generateId, generateDbTimestamps } from '../util';

const encountersConfig = {
  table_name: 'encounters',
  color: '254, 157, 93',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'description'],
    columns: [
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const up = async (db: Database): Promise<void> => {
  await db.execute(encounterTable.createTableSQL);

  // Frozen local copy of the sync-trigger shape buildTriggerSQL produces in 1784365870026_add_sync_infrastructure.ts — a migration must never depend on a shared helper, since a later edit to that helper would retroactively change this already-applied migration's behavior.
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_encounters_insert AFTER INSERT ON encounters BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('encounters:' || NEW.id, 'encounters', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `);
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_encounters_update AFTER UPDATE ON encounters BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('encounters:' || NEW.id, 'encounters', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `);
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS trg_sync_encounters_delete AFTER DELETE ON encounters BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('encounters:' || OLD.id, 'encounters', OLD.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
    END;
  `);

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();
  const layout = JSON.stringify(encountersConfig.layout);

  // WHERE NOT EXISTS on table_name, not INSERT OR IGNORE on id: id is freshly generated on every retry, so id-based dedup would create a duplicate row if this statement had already succeeded once before a later statement in this migration failed. table_name is the real domain key. (ON CONFLICT(table_name) isn't usable here — this migration runs before 1787825905519_add_table_config_unique_index creates that constraint.)
  await db.execute(
    `INSERT INTO table_config
       (id, table_name, color, layout, tagging_enabled, scope, created_at, updated_at)
     SELECT $1, $2, $3, $4, $5, $6, $7, $8
     WHERE NOT EXISTS (SELECT 1 FROM table_config WHERE table_name = $2)`,
    [
      id,
      encountersConfig.table_name,
      encountersConfig.color,
      layout,
      encountersConfig.tagging_enabled,
      encountersConfig.scope,
      created_at,
      updated_at,
    ],
  );
};

export const addEncountersMigration = {
  id: '1786186021664',
  up,
};
