// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyRecordedMigrationsBefore,
  openTestDatabase,
} from '@db/__tests__/support/sqlite-test-database';
import { backupDatabase } from '@db/database-backup';

const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const DATABASE_FILE = 'gm_tool.db';
const LEDGER_HEAD = '1789304154994';
const BACKUP_REQUEST = { databaseFile: DATABASE_FILE, ledgerHead: LEDGER_HEAD };

const readLedgerIds = (path: string): string[] => {
  const copy = new DatabaseSync(path, { readOnly: true });
  try {
    return copy
      .prepare('SELECT id FROM _migrations ORDER BY id')
      .all()
      .map((row) => String(row.id));
  } finally {
    copy.close();
  }
};

describe('backupDatabase', () => {
  let backupDir = '';

  beforeEach(() => {
    invoke.mockReset();
    backupDir = mkdtempSync(join(tmpdir(), 'gm-tool-database-backup-'));
  });

  afterEach(() => {
    rmSync(backupDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('writes a copy holding the current ledger to the staging path, then asks the backend to finish the backup and prune old ones', async () => {
    const db = openTestDatabase();
    const recordedIds = await applyRecordedMigrationsBefore(
      db,
      '1789743068849',
      '2026-01-01T00:00:00.000Z',
    );
    const stagingPath = join(backupDir, `${DATABASE_FILE}.staging`);
    let copyExistedAtFinish = false;
    invoke.mockImplementation((command) => {
      if (command === 'prepare_database_backup') {
        return Promise.resolve(stagingPath);
      }
      if (command === 'finish_database_backup') {
        copyExistedAtFinish = existsSync(stagingPath);
      }
      return Promise.resolve(null);
    });

    await backupDatabase(db, DATABASE_FILE, LEDGER_HEAD);

    expect(invoke.mock.calls).toEqual([
      ['prepare_database_backup', BACKUP_REQUEST],
      ['finish_database_backup', BACKUP_REQUEST],
      ['prune_database_backups', BACKUP_REQUEST],
    ]);
    expect(copyExistedAtFinish).toBe(true);
    expect(readLedgerIds(stagingPath)).toEqual(recordedIds);
  });

  it('runs no SQL and does not finish when the backend reports a finished backup at this ledger head', async () => {
    const db = openTestDatabase();
    invoke.mockResolvedValue(null);

    await backupDatabase(db, DATABASE_FILE, LEDGER_HEAD);

    expect(invoke.mock.calls).toEqual([
      ['prepare_database_backup', BACKUP_REQUEST],
    ]);
    expect(db.callCount()).toBe(0);
  });

  it('neither asks the backend nor copies anything for an empty ledger', async () => {
    const db = openTestDatabase();

    await backupDatabase(db, DATABASE_FILE, null);

    expect(invoke).not.toHaveBeenCalled();
    expect(db.callCount()).toBe(0);
  });

  it('rejects without finishing the backup when the copy fails', async () => {
    const db = openTestDatabase();
    invoke.mockResolvedValue(join(backupDir, 'missing-directory', 'copy'));

    await expect(
      backupDatabase(db, DATABASE_FILE, LEDGER_HEAD),
    ).rejects.toThrow();

    expect(invoke.mock.calls).toEqual([
      ['prepare_database_backup', BACKUP_REQUEST],
    ]);
  });

  it('resolves and logs the failure when pruning fails after the backup is finished', async () => {
    const db = openTestDatabase();
    const pruneError = new Error('prune failed');
    invoke.mockImplementation((command) => {
      if (command === 'prepare_database_backup') {
        return Promise.resolve(join(backupDir, `${DATABASE_FILE}.staging`));
      }
      if (command === 'prune_database_backups') {
        return Promise.reject(pruneError);
      }
      return Promise.resolve(null);
    });
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => null);

    await backupDatabase(db, DATABASE_FILE, LEDGER_HEAD);

    expect(invoke.mock.calls.map(([command]) => command)).toEqual([
      'prepare_database_backup',
      'finish_database_backup',
      'prune_database_backups',
    ]);
    expect(consoleError).toHaveBeenCalledWith(
      'Pruning old database backups failed:',
      pruneError,
    );
  });
});
