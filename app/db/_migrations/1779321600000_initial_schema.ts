import type Database from '@tauri-apps/plugin-sql';

// Frozen copies of what each db/<domain>/schema.ts's createTableSQL produced when this migration was frozen — a migration must never depend on a live schema module (see app/db/CLAUDE.md — Migrations).
const CREATE_IMAGES_SQL = `
  CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    file_extension TEXT NOT NULL,
    original_filename TEXT,
    file_size INTEGER,
    frame_x REAL,
    frame_y REAL,
    frame_zoom REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const CREATE_ADVENTURES_SQL = `
  CREATE TABLE IF NOT EXISTS adventures (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    image_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
  )
`;

const CREATE_SESSIONS_SQL = `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    summary TEXT,
    session_date TEXT,
    active_view TEXT NOT NULL DEFAULT 'prep',
    adventure_id TEXT NOT NULL,
    pinned_order INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
  )
`;

const CREATE_SESSION_STEPS_SQL = `
  CREATE TABLE IF NOT EXISTS session_steps (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT,
    content TEXT,
    default_step_key TEXT,
    checked INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )
`;

// Migration-local helper for the six identical legacy entity tables — precedent: buildTriggerSQL in 1784365870026_add_sync_infrastructure.ts. Called only with the fixed literals 'npcs', 'foes', 'items', 'locations', 'factions', 'pcs' below.
const legacyEntityTableSQL = (tableName: string): string => `
  CREATE TABLE IF NOT EXISTS ${tableName} (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
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

const CREATE_TABLE_CONFIG_SQL = `
  CREATE TABLE IF NOT EXISTS table_config (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    color TEXT NOT NULL,
    tagging_enabled INTEGER NOT NULL DEFAULT 1,
    scope TEXT NOT NULL DEFAULT 'adventure',
    layout TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const up = async (db: Database): Promise<void> => {
  await db.execute(CREATE_IMAGES_SQL);
  await db.execute(CREATE_ADVENTURES_SQL);
  await db.execute(CREATE_SESSIONS_SQL);
  await db.execute(CREATE_SESSION_STEPS_SQL);
  await db.execute(legacyEntityTableSQL('npcs'));
  await db.execute(legacyEntityTableSQL('foes'));
  await db.execute(legacyEntityTableSQL('items'));
  await db.execute(legacyEntityTableSQL('locations'));
  await db.execute(legacyEntityTableSQL('factions'));
  await db.execute(legacyEntityTableSQL('pcs'));
  await db.execute(CREATE_TABLE_CONFIG_SQL);
};

export const initialSchemaMigration = {
  id: '1779321600000',
  up,
};
