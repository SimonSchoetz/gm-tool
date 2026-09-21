// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Adventure, UpdateAdventureInput } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readAdventure = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Adventure[]>(
    'SELECT * FROM adventures WHERE id = $1',
    [id],
  );
  return rows[0];
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes a new name with a new updated_at and leaves the other fields as they were', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const id = await create();
    await update(id, { description: 'kept' });
    vi.setSystemTime(new Date(T2));

    await update(id, { name: 'New name' });

    expect(await readAdventure(id)).toEqual({
      id,
      name: 'New name',
      description: 'kept',
      image_id: null,
      created_at: T1,
      updated_at: T2,
    });
  });

  it('clears description and image_id when they are set to null', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const { seedImage } = await import('@db/__tests__/support/image-fixtures');
    const id = await create();
    await seedImage('image-1', 'png', T1);
    await update(id, { description: 'to clear', image_id: 'image-1' });
    expect(await readAdventure(id)).toMatchObject({
      description: 'to clear',
      image_id: 'image-1',
    });

    await update(id, { description: null, image_id: null });

    expect(await readAdventure(id)).toMatchObject({
      description: null,
      image_id: null,
    });
  });

  it('rejects a numeric name and leaves the row unchanged', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const id = await create();
    const before = await readAdventure(id);

    await expect(
      update(id, { name: 5 } as unknown as UpdateAdventureInput),
    ).rejects.toThrow();

    expect(await readAdventure(id)).toEqual(before);
  });
});
