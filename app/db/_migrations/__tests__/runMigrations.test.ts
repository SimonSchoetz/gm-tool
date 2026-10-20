// @vitest-environment node
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  applyRecordedMigrationsBefore,
  openTestDatabase,
  skipBackup,
  type TestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { migrations, runMigrations } from '@db/_migrations';

const BASE_ENTITIES_MIGRATION_ID = '1789304154994';
const LEGACY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items'];
const MIGRATION_IDS = migrations.map((migration) => migration.id);
const APPLIED_AT = '2026-01-01T00:00:00.000Z';

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

    await runMigrations(db, skipBackup);

    expect((await readLedger(db)).map((row) => row.id)).toEqual(MIGRATION_IDS);
  });

  it('leaves every ledger row and its applied_at unchanged on a second call', async () => {
    const db = openTestDatabase();
    const firstRunAt = new Date('2026-01-01T00:00:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(firstRunAt);
    await runMigrations(db, skipBackup);

    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    await runMigrations(db, skipBackup);

    expect(await readLedger(db)).toEqual(
      MIGRATION_IDS.map((id) => ({ id, applied_at: firstRunAt.toISOString() })),
    );
  });

  it('runs only the migrations missing from the ledger and keeps the applied ones as they were', async () => {
    const db = openTestDatabase();
    const appliedIds = await applyRecordedMigrationsBefore(
      db,
      BASE_ENTITIES_MIGRATION_ID,
      APPLIED_AT,
    );

    await runMigrations(db, skipBackup);

    const tableNames = await readTableNames(db);
    for (const legacyTable of LEGACY_TABLES) {
      expect(tableNames).not.toContain(legacyTable);
    }
    expect(tableNames).toContain('base_entity_content_sections');
    const ledger = await readLedger(db);
    expect(ledger.map((row) => row.id)).toEqual(MIGRATION_IDS);
    expect(ledger.slice(0, appliedIds.length)).toEqual(
      appliedIds.map((id) => ({ id, applied_at: APPLIED_AT })),
    );
  });

  it('writes no ledger row for a migration that failed and completes the chain on the next call', async () => {
    const db = openTestDatabase();
    // Calls 1 and 2 are the runner's own CREATE TABLE for the ledger and its SELECT of applied ids; calls 3 and 4 are the first two statements of the initial schema migration.
    db.failOnCall(4);

    await expect(runMigrations(db, skipBackup)).rejects.toThrow(
      'Injected failure',
    );

    expect(await db.select<unknown[]>('SELECT id FROM _migrations')).toEqual(
      [],
    );
    await runMigrations(db, skipBackup);
    expect((await readLedger(db)).map((row) => row.id)).toEqual(MIGRATION_IDS);
  });

  it('calls beforeFirstPending once with the highest applied id, while the database still has the schema the ledger records', async () => {
    const db = openTestDatabase();
    const appliedIds = await applyRecordedMigrationsBefore(
      db,
      BASE_ENTITIES_MIGRATION_ID,
      APPLIED_AT,
    );
    const seen: { ledgerHead: string | null; tableNames: string[] }[] = [];

    await runMigrations(db, async (ledgerHead) => {
      seen.push({ ledgerHead, tableNames: await readTableNames(db) });
    });

    expect(seen.map((call) => call.ledgerHead)).toEqual([appliedIds.at(-1)]);
    expect(seen[0].tableNames).toContain('npcs');
    expect(seen[0].tableNames).not.toContain('base_entities');
  });

  it('calls beforeFirstPending with null on a fresh database', async () => {
    const db = openTestDatabase();
    const beforeFirstPending = vi.fn(skipBackup);

    await runMigrations(db, beforeFirstPending);

    expect(beforeFirstPending.mock.calls).toEqual([[null]]);
  });

  it('does not call beforeFirstPending when no migration is pending', async () => {
    const db = openTestDatabase();
    await runMigrations(db, skipBackup);
    const beforeFirstPending = vi.fn(skipBackup);

    await runMigrations(db, beforeFirstPending);

    expect(beforeFirstPending).not.toHaveBeenCalled();
  });

  it('runs no migration when beforeFirstPending rejects', async () => {
    const db = openTestDatabase();
    const appliedIds = await applyRecordedMigrationsBefore(
      db,
      BASE_ENTITIES_MIGRATION_ID,
      APPLIED_AT,
    );
    const tablesBefore = await readTableNames(db);

    await expect(
      runMigrations(db, () => Promise.reject(new Error('backup failed'))),
    ).rejects.toThrow('backup failed');

    expect((await readLedger(db)).map((row) => row.id)).toEqual(appliedIds);
    expect(await readTableNames(db)).toEqual(tablesBefore);
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
