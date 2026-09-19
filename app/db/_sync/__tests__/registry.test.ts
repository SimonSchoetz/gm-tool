// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  openTestDatabase,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { runMigrations } from '@db/_migrations';
import { SYNCED_TABLES, SYNCED_TABLE_NAMES } from '../registry';

const openMigratedDatabase = async (): Promise<TestDatabase> => {
  const db = openTestDatabase();
  await runMigrations(db);
  return db;
};

describe('registry', () => {
  it('has an insert, an update and a delete trigger for every synced table and no trigger for any other table', async () => {
    const db = await openMigratedDatabase();

    const triggers = await db.select<{ name: string; tbl_name: string }[]>(
      "SELECT name, tbl_name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'trg_sync_%'",
    );

    expect(new Set(triggers.map((trigger) => trigger.tbl_name))).toEqual(
      new Set(SYNCED_TABLE_NAMES),
    );
    for (const tableName of SYNCED_TABLE_NAMES) {
      expect(
        triggers
          .filter((trigger) => trigger.tbl_name === tableName)
          .map((trigger) => trigger.name)
          .sort(),
      ).toEqual([
        `trg_sync_${tableName}_delete`,
        `trg_sync_${tableName}_insert`,
        `trg_sync_${tableName}_update`,
      ]);
    }
  });

  it("lists the column names of each migrated table as the table's registry columns", async () => {
    const db = await openMigratedDatabase();

    for (const table of SYNCED_TABLES) {
      const migratedColumns = await db.select<{ name: string }[]>(
        `PRAGMA table_info(${table.name})`,
      );
      expect([...table.columns].sort(), table.name).toEqual(
        migratedColumns.map((column) => column.name).sort(),
      );
    }
  });

  it('places every synced table after each synced table it references', async () => {
    const db = await openMigratedDatabase();

    for (const table of SYNCED_TABLES) {
      const references = await db.select<{ table: string }[]>(
        `PRAGMA foreign_key_list(${table.name})`,
      );
      for (const reference of references) {
        expect(
          SYNCED_TABLE_NAMES.indexOf(reference.table),
          `${table.name} references ${reference.table}`,
        ).toBeLessThan(SYNCED_TABLE_NAMES.indexOf(table.name));
      }
    }
  });

  it('includes id and updated_at in the columns of every synced table', () => {
    for (const table of SYNCED_TABLES) {
      expect(table.columns, table.name).toContain('id');
      expect(table.columns, table.name).toContain('updated_at');
    }
  });
});
