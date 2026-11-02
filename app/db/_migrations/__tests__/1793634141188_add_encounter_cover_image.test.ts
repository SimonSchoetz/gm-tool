// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyMigrationsBefore,
  openTestDatabase,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { addEncounterCoverImageMigration } from '../1793634141188_add_encounter_cover_image';

const BASE_ENTITY_TABLES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
];
const SEEDED_AT = '2026-01-01T00:00:00.000Z';
const COVER_COLUMN = {
  key: 'image_id',
  label: 'Cover',
  sortable: false,
  resizable: false,
  width: 136,
};

type Column = { key: string; label: string; width: number };
type Layout = {
  searchable_columns: string[];
  columns: Column[];
  sort_state: unknown;
};

const readLayouts = async (db: TestDatabase) => {
  const rows = await db.select<{ table_name: string; layout: string }[]>(
    'SELECT table_name, layout FROM table_config ORDER BY table_name',
  );
  return Object.fromEntries(
    rows.map((row) => [row.table_name, JSON.parse(row.layout) as Layout]),
  );
};

const writeLayout = (db: TestDatabase, tableName: string, layout: Layout) =>
  db.execute('UPDATE table_config SET layout = $1 WHERE table_name = $2', [
    JSON.stringify(layout),
    tableName,
  ]);

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
  await applyMigrationsBefore(db, addEncounterCoverImageMigration.id);
  return db;
};

// Ids, timestamps and sync-change rows of `table_config` are left out: the seed migration gives every fresh database random ids and wall-clock timestamps.
const snapshot = async (db: TestDatabase) => ({
  encounterColumns: await db.select<unknown[]>('PRAGMA table_info(encounters)'),
  encounterForeignKeys: await db.select<unknown[]>(
    'PRAGMA foreign_key_list(encounters)',
  ),
  layouts: await db.select<unknown[]>(
    'SELECT table_name, layout FROM table_config ORDER BY table_name',
  ),
});

describe('addEncounterCoverImageMigration.up', () => {
  it('adds a nullable image_id to encounters that is set to NULL when its image row is deleted', async () => {
    const db = await seedDatabase();

    await addEncounterCoverImageMigration.up(db);

    await db.execute(
      'INSERT INTO adventures (id, created_at, updated_at) VALUES ($1, $2, $2)',
      ['adventure-1', SEEDED_AT],
    );
    await db.execute(
      'INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)',
      ['image-1', 'png', SEEDED_AT],
    );
    await db.execute(
      'INSERT INTO encounters (id, adventure_id, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)',
      ['encounter-1', 'adventure-1', 'image-1', SEEDED_AT],
    );
    await db.execute('DELETE FROM images WHERE id = $1', ['image-1']);
    const [encounter] = await db.select<{ image_id: string | null }[]>(
      'SELECT image_id FROM encounters WHERE id = $1',
      ['encounter-1'],
    );
    expect(encounter.image_id).toBeNull();
  });

  it('relabels the image column of the six base-entity lists to Cover and keeps their widths, sort state and other columns', async () => {
    const db = await seedDatabase();
    // A resized width and a changed sort state, as a user's list holds them, must survive the rewrite.
    const seeded = await readLayouts(db);
    await writeLayout(db, 'npcs', {
      ...seeded.npcs,
      columns: seeded.npcs.columns.map((column) =>
        column.key === 'image_id' ? { ...column, width: 180 } : column,
      ),
      sort_state: { column: 'name', direction: 'asc' },
    });
    const layoutsBefore = await readLayouts(db);
    // The seeded lists must label the column Avatar, or the assertions below would hold without the migration doing anything.
    for (const table of BASE_ENTITY_TABLES) {
      expect(
        layoutsBefore[table].columns.find((column) => column.key === 'image_id')
          ?.label,
      ).toBe('Avatar');
    }

    await addEncounterCoverImageMigration.up(db);

    const layoutsAfter = await readLayouts(db);
    for (const table of BASE_ENTITY_TABLES) {
      expect(layoutsAfter[table]).toEqual({
        ...layoutsBefore[table],
        columns: layoutsBefore[table].columns.map((column) =>
          column.key === 'image_id' ? { ...column, label: 'Cover' } : column,
        ),
      });
    }
  });

  it('prepends the Cover column to the encounters list and keeps its other columns, sort state and searchable columns', async () => {
    const db = await seedDatabase();
    const layoutsBefore = await readLayouts(db);
    // The seeded encounters list must hold no image column, or the assertion below would hold without the migration doing anything.
    expect(
      layoutsBefore.encounters.columns.map((column) => column.key),
    ).not.toContain('image_id');

    await addEncounterCoverImageMigration.up(db);

    expect((await readLayouts(db)).encounters).toEqual({
      ...layoutsBefore.encounters,
      columns: [COVER_COLUMN, ...layoutsBefore.encounters.columns],
    });
  });

  it('leaves a layout that already reads Cover and an encounters layout that already has the column as they were, with every table_config updated_at and change seq', async () => {
    const db = await seedDatabase();
    const seeded = await readLayouts(db);
    await writeLayout(db, 'npcs', {
      ...seeded.npcs,
      columns: seeded.npcs.columns.map((column) =>
        column.key === 'image_id' ? { ...column, label: 'Cover' } : column,
      ),
    });
    await writeLayout(db, 'encounters', {
      ...seeded.encounters,
      columns: [{ ...COVER_COLUMN, width: 200 }, ...seeded.encounters.columns],
    });
    const layoutsBefore = await readLayouts(db);
    const timestampsBefore = await readConfigTimestamps(db);
    const seqBefore = {
      npcs: await readConfigChangeSeq(db, 'npcs'),
      encounters: await readConfigChangeSeq(db, 'encounters'),
    };

    await addEncounterCoverImageMigration.up(db);

    const layoutsAfter = await readLayouts(db);
    expect(layoutsAfter.npcs).toEqual(layoutsBefore.npcs);
    expect(layoutsAfter.encounters).toEqual(layoutsBefore.encounters);
    expect(await readConfigTimestamps(db)).toEqual(timestampsBefore);
    // A rewrite of an unchanged layout fires the update trigger and bumps the row's change seq, so an unchanged seq shows no UPDATE ran.
    expect(await readConfigChangeSeq(db, 'npcs')).toBe(seqBefore.npcs);
    expect(await readConfigChangeSeq(db, 'encounters')).toBe(
      seqBefore.encounters,
    );
  });

  it('leaves every table_config updated_at as it was when it rewrites the layouts', async () => {
    const db = await seedDatabase();
    const timestampsBefore = await readConfigTimestamps(db);

    await addEncounterCoverImageMigration.up(db);

    expect(await readConfigTimestamps(db)).toEqual(timestampsBefore);
  });

  it('rewrites the lists that have a table_config row when another list has none', async () => {
    const db = await seedDatabase();
    await db.execute('DELETE FROM table_config WHERE table_name IN ($1, $2)', [
      'items',
      'encounters',
    ]);

    await addEncounterCoverImageMigration.up(db);

    const layouts = await readLayouts(db);
    expect(layouts).not.toHaveProperty('items');
    expect(layouts).not.toHaveProperty('encounters');
    for (const table of BASE_ENTITY_TABLES.filter((name) => name !== 'items')) {
      expect(
        layouts[table].columns.find((column) => column.key === 'image_id')
          ?.label,
      ).toBe('Cover');
    }
  });

  it('leaves the snapshot unchanged when run a second time on the migrated database', async () => {
    const db = await seedDatabase();
    await addEncounterCoverImageMigration.up(db);
    const migrated = await snapshot(db);

    await addEncounterCoverImageMigration.up(db);

    expect(await snapshot(db)).toEqual(migrated);
  });

  it('ends in the clean run snapshot when interrupted before any one statement and run again', async () => {
    const cleanDb = await seedDatabase();
    const callsBeforeUp = cleanDb.callCount();
    await addEncounterCoverImageMigration.up(cleanDb);
    const statementCount = cleanDb.callCount() - callsBeforeUp;
    const cleanSnapshot = await snapshot(cleanDb);

    for (let call = 1; call <= statementCount; call++) {
      const db = await seedDatabase();
      db.failOnCall(db.callCount() + call);
      await expect(addEncounterCoverImageMigration.up(db)).rejects.toThrow(
        /^Injected failure$/,
      );

      await addEncounterCoverImageMigration.up(db);

      expect(
        await snapshot(db),
        `interrupted before statement ${call}`,
      ).toEqual(cleanSnapshot);
    }
  });
});
