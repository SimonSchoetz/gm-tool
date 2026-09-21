// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const SEEDED_AT = '2026-01-10T09:00:00.000Z';

describe('remove', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { answerImageCommand } =
      await import('@db/__tests__/support/image-fixtures');
    invoke.mockImplementation(answerImageCommand);
  });

  it('deletes only its own row and file, and clears the image of the adventure and base entity that referenced it', async () => {
    const { remove } = await import('../remove');
    const { create: createAdventure, update: updateAdventure } =
      await import('@db/adventure');
    const { create: createBaseEntity, update: updateBaseEntity } =
      await import('@db/base-entity');
    const { getDatabase } = await import('@db/database');
    const { seedImage } = await import('@db/__tests__/support/image-fixtures');
    const db = await getDatabase();
    await seedImage('image-1', 'png', SEEDED_AT);
    await seedImage('image-2', 'png', SEEDED_AT);
    const adventureId = await createAdventure();
    const baseEntityId = await createBaseEntity('npcs', adventureId);
    await updateAdventure(adventureId, { image_id: 'image-1' });
    await updateBaseEntity(baseEntityId, { image_id: 'image-1' });

    await remove('image-1');

    expect(await db.select<unknown[]>('SELECT id FROM images')).toEqual([
      { id: 'image-2' },
    ]);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('delete_image', {
      id: 'image-1',
      extension: 'png',
    });
    expect(
      await db.select<unknown[]>('SELECT image_id FROM adventures'),
    ).toEqual([{ image_id: null }]);
    expect(
      await db.select<unknown[]>('SELECT image_id FROM base_entities'),
    ).toEqual([{ image_id: null }]);
  });

  it('deletes nothing and deletes no file for an id with no image', async () => {
    const { remove } = await import('../remove');
    const { seedImage, readImages } =
      await import('@db/__tests__/support/image-fixtures');
    await seedImage('image-1', 'png', SEEDED_AT);

    await remove('missing-image');

    expect((await readImages()).map((image) => image.id)).toEqual(['image-1']);
    expect(invoke).not.toHaveBeenCalled();
  });
});
