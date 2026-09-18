import type Database from '@tauri-apps/plugin-sql';
import { z } from 'zod';

// Frozen copy of what db/base-entity-content-section/schema.ts's createTableSQL produced when this migration was frozen, for the same reason the trigger SQL below is frozen — a migration must never depend on a live schema module (see app/db/CLAUDE.md — Migrations).
const CREATE_BASE_ENTITY_CONTENT_SECTIONS_SQL = `
  CREATE TABLE IF NOT EXISTS base_entity_content_sections (
    id TEXT PRIMARY KEY,
    base_entity_id TEXT NOT NULL,
    name TEXT,
    type TEXT NOT NULL,
    content TEXT,
    checked INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (base_entity_id) REFERENCES base_entities(id) ON DELETE CASCADE
  )
`;

// Frozen local copy of the sync-trigger shape buildTriggerSQL produces in 1784365870026_add_sync_infrastructure.ts — a migration must never depend on a shared helper, since a later edit to that helper would retroactively change this already-applied migration's behavior.
const CREATE_INSERT_TRIGGER_SQL = `
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entity_content_sections_insert AFTER INSERT ON base_entity_content_sections BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entity_content_sections:' || NEW.id, 'base_entity_content_sections', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `;
const CREATE_UPDATE_TRIGGER_SQL = `
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entity_content_sections_update AFTER UPDATE ON base_entity_content_sections BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entity_content_sections:' || NEW.id, 'base_entity_content_sections', NEW.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
    END;
  `;
const CREATE_DELETE_TRIGGER_SQL = `
    CREATE TRIGGER IF NOT EXISTS trg_sync_base_entity_content_sections_delete AFTER DELETE ON base_entity_content_sections BEGIN
      UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
      INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
        VALUES ('base_entity_content_sections:' || OLD.id, 'base_entity_content_sections', OLD.id,
                (SELECT value FROM _sync_meta WHERE id = 'seq'), 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
    END;
  `;

// The section id reuses the base entity id, so every device's migration produces the same row and sync merges it instead of duplicating it. The same key makes ON CONFLICT(id) DO NOTHING idempotent. The copy also keeps the entity's timestamps for the same reason.
const COPY_SUMMARIES_SQL =
  "INSERT INTO base_entity_content_sections (id, base_entity_id, name, type, content, sort_order, created_at, updated_at) SELECT id, id, 'Summary', 'text', summary, 0, created_at, updated_at FROM base_entities WHERE summary IS NOT NULL ON CONFLICT(id) DO NOTHING";

// Frozen copy of BASE_ENTITY_TYPES (domain/entities/entityTypes.ts) — a migration must never depend on a live, mutable registry (see app/db/CLAUDE.md — Migrations). These are the table_config.table_name values of the base-entity lists.
const BASE_ENTITY_TABLE_NAMES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
];

// Frozen copy of db/table-config/layout-schema.ts's tableLayoutSchema (including its inner layoutColumnSchema and persistedSortStateSchema shapes) — a migration must never depend on a live schema module, since a later edit would retroactively change this already-applied migration's behavior.
const frozenLayoutColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional(),
  resizable: z.boolean().optional(),
  width: z.number(),
});

const frozenPersistedSortStateSchema = z.object({
  column: z.string(),
  direction: z.enum(['asc', 'desc']),
});

const frozenTableLayoutSchema = z.object({
  searchable_columns: z.array(z.string()),
  columns: z.array(frozenLayoutColumnSchema),
  sort_state: frozenPersistedSortStateSchema,
});

const CONFIG_SELECT_SQL =
  'SELECT id, layout FROM table_config WHERE table_name IN ($1, $2, $3, $4, $5, $6)';

const up = async (db: Database): Promise<void> => {
  await db.execute(CREATE_BASE_ENTITY_CONTENT_SECTIONS_SQL);

  // The triggers are created before any row is inserted, so every copied section gets a _sync_changes record.
  await db.execute(CREATE_INSERT_TRIGGER_SQL);
  await db.execute(CREATE_UPDATE_TRIGGER_SQL);
  await db.execute(CREATE_DELETE_TRIGGER_SQL);

  // The PRAGMA table_info check replaces the IF EXISTS that DROP COLUMN lacks. It lets a resumed run skip the copy and the drop once the column is gone, and it keeps the copy ahead of the drop.
  const baseEntityColumns = await db.select<{ name: string }[]>(
    'PRAGMA table_info(base_entities)',
  );
  const summaryColumnExists = baseEntityColumns.some(
    (column) => column.name === 'summary',
  );

  if (summaryColumnExists) {
    await db.execute(COPY_SUMMARIES_SQL);
    await db.execute('ALTER TABLE base_entities DROP COLUMN summary');
  }

  const configRows = await db.select<{ id: string; layout: string }[]>(
    CONFIG_SELECT_SQL,
    BASE_ENTITY_TABLE_NAMES,
  );

  for (const row of configRows) {
    // db.select<T>()'s type parameter is a compile-time assertion only, never runtime-validated, so a row that doesn't actually carry a layout string is skipped here rather than crashing the whole migration chain; a row whose layout IS a string but isn't valid JSON still throws via frozenTableLayoutSchema.parse below.
    if (typeof row.layout !== 'string') continue;

    const layout = frozenTableLayoutSchema.parse(JSON.parse(row.layout));
    if (!layout.searchable_columns.includes('summary')) continue;

    // updated_at is left unchanged because every device writes the identical layout.
    await db.execute('UPDATE table_config SET layout = $1 WHERE id = $2', [
      JSON.stringify({
        ...layout,
        searchable_columns: layout.searchable_columns.filter(
          (column) => column !== 'summary',
        ),
      }),
      row.id,
    ]);
  }
};

export const addBaseEntityContentSectionsMigration = {
  id: '1789743068849',
  up,
};
