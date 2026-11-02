// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openSqliteDatabase } from '../../sqliteDatabase';

const seedContext = () => ({
  db: openSqliteDatabase(':memory:'),
  imagesDir: '/seed/images',
  fixturePaths: [],
});

describe('seedPlatform', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('loadDatabase rejects before a context is provided', async () => {
    const { loadDatabase } = await import('../seedPlatform');

    await expect(loadDatabase()).rejects.toThrow(
      /^The web-mode seed loaded the database before one was provided\.$/,
    );
  });

  it('loadDatabase resolves to the provided database', async () => {
    const { loadDatabase, provideSeedContext } =
      await import('../seedPlatform');
    const context = seedContext();

    provideSeedContext(context);

    await expect(loadDatabase()).resolves.toBe(context.db);
  });

  it('invoke rejects before a context is provided', async () => {
    const { invoke } = await import('../seedPlatform');

    await expect(
      invoke('get_image_url', { id: 'a', extension: 'png' }),
    ).rejects.toThrow(
      /^The web-mode seed loaded the database before one was provided\.$/,
    );
  });

  it("invoke answers from the dev data server's command table with the provided context", async () => {
    const { invoke, provideSeedContext } = await import('../seedPlatform');
    provideSeedContext(seedContext());

    await expect(
      invoke('get_image_url', { id: 'a', extension: 'png' }),
    ).resolves.toBe('/__dev-data/images/a.png');
  });
});
