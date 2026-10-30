// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openSqliteDatabase } from '../sqliteDatabase';

describe('seedPlatform loadDatabase', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects before a database is provided', async () => {
    const { loadDatabase } = await import('../seed/seedPlatform');

    await expect(loadDatabase()).rejects.toThrow(
      /^The web-mode seed loaded the database before one was provided\.$/,
    );
  });

  it('resolves to the provided database', async () => {
    const { loadDatabase, provideSeedDatabase } =
      await import('../seed/seedPlatform');
    const db = openSqliteDatabase(':memory:');

    provideSeedDatabase(db);

    await expect(loadDatabase()).resolves.toBe(db);
  });
});
