import type Database from '@tauri-apps/plugin-sql';
import type { Migration } from './index.ts';
import { z } from 'zod';
import { ensureColumn } from '../util/index.ts';

// SQLite has no ADD CONSTRAINT, so the foreign key is declared in the ADD COLUMN statement itself; the column is nullable, which ADD COLUMN with a REFERENCES clause requires.
const ADD_IMAGE_ID_SQL =
  'ALTER TABLE encounters ADD COLUMN image_id TEXT REFERENCES images(id) ON DELETE SET NULL';

// Frozen copy of BASE_ENTITY_TYPES (domain/entities/entityTypes.ts) — a migration must never depend on a live, mutable registry (see app/db/CLAUDE.md — Migrations). These are the table_config.table_name values of the base-entity lists, whose image column is relabelled.
const BASE_ENTITY_TABLE_NAMES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
];

// The table_config.table_name of the encounters list, which gains the image column.
const ENCOUNTERS_TABLE_NAME = 'encounters';

// Frozen copy of the label and the column the lists show for an entity's image, as the app wrote them when this migration was frozen.
const COVER_LABEL = 'Cover';
const IMAGE_COLUMN_KEY = 'image_id';
const COVER_COLUMN = {
  key: IMAGE_COLUMN_KEY,
  label: COVER_LABEL,
  sortable: false,
  resizable: false,
  width: 136,
};

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

type Layout = z.infer<typeof frozenTableLayoutSchema>;

const CONFIG_SELECT_SQL =
  'SELECT id, table_name, layout FROM table_config WHERE table_name IN ($1, $2, $3, $4, $5, $6, $7)';

const relabelImageColumn = (layout: Layout): Layout | null => {
  const needsRelabel = layout.columns.some(
    (column) => column.key === IMAGE_COLUMN_KEY && column.label !== COVER_LABEL,
  );
  if (!needsRelabel) return null;

  return {
    ...layout,
    columns: layout.columns.map((column) =>
      column.key === IMAGE_COLUMN_KEY
        ? { ...column, label: COVER_LABEL }
        : column,
    ),
  };
};

const prependImageColumn = (layout: Layout): Layout | null => {
  const hasImageColumn = layout.columns.some(
    (column) => column.key === IMAGE_COLUMN_KEY,
  );
  if (hasImageColumn) return null;

  return { ...layout, columns: [COVER_COLUMN, ...layout.columns] };
};

const up = async (db: Database): Promise<void> => {
  await ensureColumn(db, 'encounters', 'image_id', ADD_IMAGE_ID_SQL);

  const configRows = await db.select<
    { id: string; table_name: string; layout: string }[]
  >(CONFIG_SELECT_SQL, [...BASE_ENTITY_TABLE_NAMES, ENCOUNTERS_TABLE_NAME]);

  for (const row of configRows) {
    const layout = frozenTableLayoutSchema.parse(JSON.parse(row.layout));
    const changedLayout =
      row.table_name === ENCOUNTERS_TABLE_NAME
        ? prependImageColumn(layout)
        : relabelImageColumn(layout);
    if (changedLayout === null) continue;

    // updated_at is left unchanged because every device writes the identical layout.
    await db.execute('UPDATE table_config SET layout = $1 WHERE id = $2', [
      JSON.stringify(changedLayout),
      row.id,
    ]);
  }
};

export const addEncounterCoverImageMigration: Migration = {
  id: '1793634141188',
  up,
};
