import type Database from '@tauri-apps/plugin-sql';

// FK dependency order: parents before children. Mirrors db/_sync/registry.ts,
// but this array is a frozen migration-local copy — a migration must never
// import the live registry, which future migrations will extend.
const SYNCED_TABLE_NAMES = [
  'images',
  'adventures',
  'sessions',
  'npcs',
  'pcs',
  'foes',
  'factions',
  'locations',
  'items',
  'session_steps',
  'table_config',
];

const buildTriggerSQL = (
  tableName: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
): string => {
  if (event === 'DELETE') {
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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _sync_meta (
      id TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    )
  `);
  await db.execute(
    'INSERT OR IGNORE INTO _sync_meta (id, value) VALUES ($1, $2)',
    ['seq', 0],
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS _sync_changes (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      row_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_sync_changes_seq ON _sync_changes (seq)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS _sync_peers (
      id TEXT PRIMARY KEY,
      last_received_seq INTEGER NOT NULL DEFAULT 0
    )
  `);

  for (const tableName of SYNCED_TABLE_NAMES) {
    await db.execute(buildTriggerSQL(tableName, 'INSERT'));
    await db.execute(buildTriggerSQL(tableName, 'UPDATE'));
    await db.execute(buildTriggerSQL(tableName, 'DELETE'));
  }
};

export const addSyncInfrastructureMigration = {
  id: '1784365870026',
  up,
};
