// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyMigrationsBefore,
  openTestDatabase,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { addBaseEntityContentSectionsMigration } from '../1789743068849_add_base_entity_content_sections';

const BASE_ENTITY_TABLES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
];
const BASE_ENTITY_TABLE_PLACEHOLDERS = BASE_ENTITY_TABLES.map(
  (_table, index) => `$${index + 1}`,
).join(', ');
const ADVENTURE_ID = 'adventure-1';
const SEEDED_AT = '2026-01-01T00:00:00.000Z';

// The four summary shapes the copy must tell apart: text, `NULL`, the empty string and stored JSON.
const ENTITIES = [
  { id: 'entity-text', summary: 'An npc summary' },
  { id: 'entity-null', summary: null },
  { id: 'entity-empty', summary: '' },
  { id: 'entity-json', summary: '{"type":"doc","children":[]}' },
].map((entity, index) => ({
  ...entity,
  entity_type: 'npcs',
  created_at: `2026-02-0${index + 1}T00:00:00.000Z`,
  updated_at: `2026-03-0${index + 1}T00:00:00.000Z`,
}));

type Layout = {
  searchable_columns: string[];
  columns: unknown[];
  sort_state: unknown;
};

const readLayouts = async (db: TestDatabase) => {
  const rows = await db.select<{ table_name: string; layout: string }[]>(
    `SELECT table_name, layout FROM table_config WHERE table_name IN (${BASE_ENTITY_TABLE_PLACEHOLDERS}) ORDER BY table_name`,
    BASE_ENTITY_TABLES,
  );
  return Object.fromEntries(
    rows.map((row) => [row.table_name, JSON.parse(row.layout) as Layout]),
  );
};

const readConfigTimestamps = (db: TestDatabase) =>
  db.select<unknown[]>(
    'SELECT table_name, updated_at FROM table_config ORDER BY table_name',
  );

const readConfigChangeSeq = async (db: TestDatabase, tableName: string) => {
  const [change] = await db.select<{ seq: number }[]>(
    "SELECT change.seq AS seq FROM _sync_changes change JOIN table_config config ON change.row_id = config.id WHERE change.table_name = 'table_config' AND config.table_name = $1",
    [tableName],
  );
  return change.seq;
};

const seedDatabase = async (): Promise<TestDatabase> => {
  const db = openTestDatabase();
  await applyMigrationsBefore(db, addBaseEntityContentSectionsMigration.id);
  await db.execute(
    'INSERT INTO adventures (id, created_at, updated_at) VALUES ($1, $2, $2)',
    [ADVENTURE_ID, SEEDED_AT],
  );
  for (const entity of ENTITIES) {
    await db.execute(
      'INSERT INTO base_entities (id, adventure_id, entity_type, summary, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        entity.id,
        ADVENTURE_ID,
        entity.entity_type,
        entity.summary,
        entity.created_at,
        entity.updated_at,
      ],
    );
  }
  // One layout that no longer lists `summary`, so the migration has nothing to rewrite there. The rewrite is plain SQL, which fires the update trigger like any other write.
  const { locations } = await readLayouts(db);
  await db.execute(
    'UPDATE table_config SET layout = $1 WHERE table_name = $2',
    [
      JSON.stringify({
        ...locations,
        searchable_columns: ['name', 'description'],
      }),
      'locations',
    ],
  );
  return db;
};

// `table_config` ids, timestamps and change rows are left out: the seed migration gives every fresh database random ids and wall-clock timestamps. Only the six base-entity layouts are read, because those are what the migration rewrites.
const snapshot = async (db: TestDatabase) => ({
  baseEntities: await db.select<unknown[]>(
    'SELECT * FROM base_entities ORDER BY id',
  ),
  sections: await db.select<unknown[]>(
    'SELECT * FROM base_entity_content_sections ORDER BY id',
  ),
  layouts: await db.select<unknown[]>(
    `SELECT table_name, layout FROM table_config WHERE table_name IN (${BASE_ENTITY_TABLE_PLACEHOLDERS}) ORDER BY table_name`,
    BASE_ENTITY_TABLES,
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

describe('addBaseEntityContentSectionsMigration.up', () => {
  it('moves every non-null summary, the empty string included, into one text section keyed by its entity, and none for a NULL summary', async () => {
    const db = await seedDatabase();

    await addBaseEntityContentSectionsMigration.up(db);

    const sections = await db.select<unknown[]>(
      'SELECT * FROM base_entity_content_sections ORDER BY id',
    );
    const entitiesWithSummary = ENTITIES.filter(
      (entity) => entity.summary !== null,
    );
    expect(sections).toHaveLength(entitiesWithSummary.length);
    for (const entity of entitiesWithSummary) {
      expect(sections).toContainEqual({
        id: entity.id,
        base_entity_id: entity.id,
        name: 'Summary',
        type: 'text',
        content: entity.summary,
        checked: 0,
        sort_order: 0,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      });
    }
  });

  it('drops the summary column from base_entities', async () => {
    const db = await seedDatabase();

    await addBaseEntityContentSectionsMigration.up(db);

    const columns = await db.select<{ name: string }[]>(
      'PRAGMA table_info(base_entities)',
    );
    expect(columns.map((column) => column.name)).not.toContain('summary');
  });

  it('removes only summary from each base-entity layout and leaves every table_config updated_at as it was', async () => {
    const db = await seedDatabase();
    const layoutsBefore = await readLayouts(db);
    const timestampsBefore = await readConfigTimestamps(db);
    // The seeded layouts must list `summary`, or the assertions below would hold without the migration doing anything.
    for (const table of BASE_ENTITY_TABLES.filter(
      (name) => name !== 'locations',
    )) {
      expect(layoutsBefore[table].searchable_columns).toContain('summary');
    }

    await addBaseEntityContentSectionsMigration.up(db);

    const layoutsAfter = await readLayouts(db);
    for (const table of BASE_ENTITY_TABLES) {
      expect(layoutsAfter[table]).toEqual({
        ...layoutsBefore[table],
        searchable_columns: ['name', 'description'],
      });
    }
    expect(await readConfigTimestamps(db)).toEqual(timestampsBefore);
  });

  it('keeps the change seq of a layout that no longer lists summary', async () => {
    const db = await seedDatabase();
    const seqBefore = await readConfigChangeSeq(db, 'locations');

    await addBaseEntityContentSectionsMigration.up(db);

    expect(await readConfigChangeSeq(db, 'locations')).toBe(seqBefore);
  });

  it('leaves the snapshot unchanged when run a second time on the migrated database', async () => {
    const db = await seedDatabase();
    await addBaseEntityContentSectionsMigration.up(db);
    const migrated = await snapshot(db);

    await addBaseEntityContentSectionsMigration.up(db);

    expect(await snapshot(db)).toEqual(migrated);
  });

  it('ends in the clean run snapshot when interrupted before any one statement and run again', async () => {
    const cleanDb = await seedDatabase();
    const callsBeforeUp = cleanDb.callCount();
    await addBaseEntityContentSectionsMigration.up(cleanDb);
    const statementCount = cleanDb.callCount() - callsBeforeUp;
    const cleanSnapshot = await snapshot(cleanDb);

    for (let call = 1; call <= statementCount; call++) {
      const db = await seedDatabase();
      db.failOnCall(db.callCount() + call);
      await expect(
        addBaseEntityContentSectionsMigration.up(db),
      ).rejects.toThrow('Injected failure');

      await addBaseEntityContentSectionsMigration.up(db);

      expect(
        await snapshot(db),
        `interrupted before statement ${call}`,
      ).toEqual(cleanSnapshot);
    }
  });
});
