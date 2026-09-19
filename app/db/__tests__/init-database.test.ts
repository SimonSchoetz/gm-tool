// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

const load = vi.hoisted(() => vi.fn());
vi.mock('@tauri-apps/plugin-sql', () => ({ default: { load } }));

describe('initDatabase', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { openTestDatabase } =
      await import('@db/__tests__/support/sqlite-test-database');
    load.mockImplementation(() => Promise.resolve(openTestDatabase()));
  });

  it('loads the database once for two concurrent calls and resolves both to it', async () => {
    const { initDatabase } = await import('@db/database');

    const [first, second] = await Promise.all([initDatabase(), initDatabase()]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('returns the same database from getDatabase() after initDatabase() without loading again', async () => {
    const { initDatabase, getDatabase } = await import('@db/database');
    const initialized = await initDatabase();

    const cached = await getDatabase();

    expect(cached).toBe(initialized);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('rejects both concurrent callers when load fails and loads again on the next getDatabase()', async () => {
    const loadError = new Error('load failed');
    load.mockRejectedValueOnce(loadError);
    const { initDatabase, getDatabase } = await import('@db/database');

    const results = await Promise.allSettled([initDatabase(), initDatabase()]);

    expect(results).toEqual([
      { status: 'rejected', reason: loadError },
      { status: 'rejected', reason: loadError },
    ]);
    await expect(getDatabase()).resolves.toBeDefined();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not cache a database whose migration failed and loads a fresh one on the next call', async () => {
    const { openTestDatabase } =
      await import('@db/__tests__/support/sqlite-test-database');
    const failingDatabase = openTestDatabase();
    // Calls 1 and 2 are the migration runner's ledger CREATE TABLE and SELECT, so call 5 fails inside the initial schema migration.
    failingDatabase.failOnCall(5);
    load.mockImplementationOnce(() => Promise.resolve(failingDatabase));
    const { initDatabase, getDatabase } = await import('@db/database');

    await expect(initDatabase()).rejects.toThrow('Injected failure');
    const laterDatabase = await getDatabase();

    expect(laterDatabase).not.toBe(failingDatabase);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
