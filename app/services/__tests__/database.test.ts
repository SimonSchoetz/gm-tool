import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as databaseModule from '@db/database';

const initDatabase = vi.hoisted(() =>
  vi.fn<typeof databaseModule.initDatabase>(),
);

vi.mock('@db/database', () => ({ initDatabase }));

beforeEach(() => {
  vi.resetModules();
  initDatabase.mockReset().mockResolvedValue({} as never);
});

describe('ensureInitialized', () => {
  it('initializes the database once, however many times it is called', async () => {
    const { ensureInitialized } = await import('../database');

    await ensureInitialized();
    await ensureInitialized();

    expect(initDatabase).toHaveBeenCalledTimes(1);
  });

  it('initializes again after a failed attempt, since a failure leaves the service uninitialized', async () => {
    const { ensureInitialized } = await import('../database');
    initDatabase.mockRejectedValueOnce(new Error('locked'));

    await expect(ensureInitialized()).rejects.toThrow(/^locked$/);
    await ensureInitialized();

    expect(initDatabase).toHaveBeenCalledTimes(2);
  });
});
