// @vitest-environment node
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  applyMigrationsBefore,
  openTestDatabase,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { migrations, runMigrations } from '@db/_migrations';

const BASE_ENTITIES_MIGRATION_ID = '1789304154994';
const LEGACY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items'];
const MIGRATION_IDS = migrations.map((migration) => migration.id);

const readLedger = (db: TestDatabase) =>
  db.select<{ id: string; applied_at: string }[]>(
    'SELECT id, applied_at FROM _migrations ORDER BY rowid',
  );

const readTableNames = async (db: TestDatabase) =>
  (
    await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table'",
    )
  ).map((table) => table.name);

describe('runMigrations', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs every migration on a fresh database and records one ledger row per id, in migrations order', async () => {
    const db = openTestDatabase();

    await runMigrations(db);

    expect((await readLedger(db)).map((row) => row.id)).toEqual(MIGRATION_IDS);
  });

  it('leaves every ledger row and its applied_at unchanged on a second call', async () => {
    const db = openTestDatabase();
    const firstRunAt = new Date('2026-01-01T00:00:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(firstRunAt);
    await runMigrations(db);

    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    await runMigrations(db);

    expect(await readLedger(db)).toEqual(
      MIGRATION_IDS.map((id) => ({ id, applied_at: firstRunAt.toISOString() })),
    );
  });

  it('runs only the migrations missing from the ledger and keeps the applied ones as they were', async () => {
    const db = openTestDatabase();
    await applyMigrationsBefore(db, BASE_ENTITIES_MIGRATION_ID);
    await db.execute(
      'CREATE TABLE _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
    );
    const appliedIds = MIGRATION_IDS.filter(
      (id) => id < BASE_ENTITIES_MIGRATION_ID,
    );
    const appliedAt = '2026-01-01T00:00:00.000Z';
    for (const id of appliedIds) {
      await db.execute(
        'INSERT INTO _migrations (id, applied_at) VALUES ($1, $2)',
        [id, appliedAt],
      );
    }

    await runMigrations(db);

    const tableNames = await readTableNames(db);
    for (const legacyTable of LEGACY_TABLES) {
      expect(tableNames).not.toContain(legacyTable);
    }
    expect(tableNames).toContain('base_entity_content_sections');
    const ledger = await readLedger(db);
    expect(ledger.map((row) => row.id)).toEqual(MIGRATION_IDS);
    expect(ledger.slice(0, appliedIds.length)).toEqual(
      appliedIds.map((id) => ({ id, applied_at: appliedAt })),
    );
  });

  it('writes no ledger row for a migration that failed and completes the chain on the next call', async () => {
    const db = openTestDatabase();
    // Calls 1 and 2 are the runner's own CREATE TABLE for the ledger and its SELECT of applied ids; calls 3 and 4 are the first two statements of the initial schema migration.
    db.failOnCall(4);

    await expect(runMigrations(db)).rejects.toThrow('Injected failure');

    expect(await db.select<unknown[]>('SELECT id FROM _migrations')).toEqual(
      [],
    );
    await runMigrations(db);
    expect((await readLedger(db)).map((row) => row.id)).toEqual(MIGRATION_IDS);
  });

  it('lists 13-digit ids in strictly ascending order, one per migration file', () => {
    const fileIds = readdirSync(fileURLToPath(new URL('..', import.meta.url)))
      .filter((name) => /^\d{13}_.+\.ts$/.test(name))
      .map((name) => name.slice(0, 13));

    expect(MIGRATION_IDS.filter((id) => !/^\d{13}$/.test(id))).toEqual([]);
    expect(
      MIGRATION_IDS.filter(
        (id, index) => index > 0 && MIGRATION_IDS[index - 1] >= id,
      ),
    ).toEqual([]);
    expect(new Set(fileIds).size).toBe(fileIds.length);
    expect([...MIGRATION_IDS].sort()).toEqual([...fileIds].sort());
  });
});
