import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as databaseModule from '@db/database';
import type * as imageServiceModule from '@services/imageService';

const initDatabase = vi.hoisted(() =>
  vi.fn<typeof databaseModule.initDatabase>(),
);

const cleanUpAbandonedImages = vi.hoisted(() =>
  vi.fn<typeof imageServiceModule.cleanUpAbandonedImages>(),
);

vi.mock('@db/database', () => ({ initDatabase }));
vi.mock('@services/imageService', () => ({ cleanUpAbandonedImages }));

beforeEach(() => {
  vi.resetModules();
  initDatabase.mockReset().mockResolvedValue({} as never);
  cleanUpAbandonedImages.mockReset().mockResolvedValue();
});

describe('ensureInitialized', () => {
  it('initializes the database once, however many times it is called', async () => {
    const { ensureInitialized } = await import('../database');

    await ensureInitialized();
    await ensureInitialized();

    expect(initDatabase).toHaveBeenCalledTimes(1);
  });

  it('cleans up abandoned images once, after the database is initialized and before it resolves', async () => {
    const { ensureInitialized } = await import('../database');

    await ensureInitialized();
    await ensureInitialized();

    expect(cleanUpAbandonedImages).toHaveBeenCalledTimes(1);
    expect(initDatabase.mock.invocationCallOrder[0]).toBeLessThan(
      cleanUpAbandonedImages.mock.invocationCallOrder[0],
    );
  });

  it('initializes again after a failed attempt, since a failure leaves the service uninitialized', async () => {
    const { ensureInitialized } = await import('../database');
    initDatabase.mockRejectedValueOnce(new Error('locked'));

    await expect(ensureInitialized()).rejects.toThrow(/^locked$/);
    await ensureInitialized();

    expect(initDatabase).toHaveBeenCalledTimes(2);
  });
});
