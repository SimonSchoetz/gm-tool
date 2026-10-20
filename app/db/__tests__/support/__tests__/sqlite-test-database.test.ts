// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyMigrationsBefore,
  applyRecordedMigrationsBefore,
  openTestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { migrations } from '@db/_migrations';

describe('openTestDatabase', () => {
  it('fails only the armed call and counts select calls', async () => {
    const db = openTestDatabase();
    db.failOnCall(2);

    await db.execute('CREATE TABLE t (x TEXT)');
    await expect(
      db.execute('INSERT INTO t (x) VALUES ($1)', ['a']),
    ).rejects.toThrow('Injected failure');
    const rows = await db.select<{ x: string }[]>('SELECT x FROM t');

    expect(rows).toEqual([]);
    expect(db.callCount()).toBe(3);
  });
});

describe('applyMigrationsBefore', () => {
  it('applies the migrations before the given id, none of the later ones, and no ledger', async () => {
    const db = openTestDatabase();

    await applyMigrationsBefore(db, '1789743068849');

    const baseEntityColumns = await db.select<{ name: string }[]>(
      'PRAGMA table_info(base_entities)',
    );
    expect(baseEntityColumns.map((column) => column.name)).toContain('summary');
    const laterTables = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('base_entity_content_sections', '_migrations')",
    );
    expect(laterTables).toEqual([]);
  });
});

describe('applyRecordedMigrationsBefore', () => {
  it('records each migration before the given id at the given time, the given one and later ones not at all', async () => {
    const db = openTestDatabase();
    const boundaryIndex = migrations.findIndex(
      (migration) => migration.id === '1789304154994',
    );
    const appliedAt = '2026-01-01T00:00:00.000Z';

    const recordedIds = await applyRecordedMigrationsBefore(
      db,
      migrations[boundaryIndex].id,
      appliedAt,
    );

    const expectedIds = migrations
      .slice(0, boundaryIndex)
      .map((migration) => migration.id);
    expect(recordedIds).toEqual(expectedIds);
    expect(
      await db.select('SELECT id, applied_at FROM _migrations ORDER BY rowid'),
    ).toEqual(expectedIds.map((id) => ({ id, applied_at: appliedAt })));
  });
});
