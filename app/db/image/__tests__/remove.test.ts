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

const answerCommand = (command: string): Promise<unknown> => {
  switch (command) {
    case 'save_image':
      return Promise.resolve(1234);
    case 'read_image_bytes':
      return Promise.resolve('aW1hZ2U=');
    case 'save_image_bytes':
    case 'delete_image':
      return Promise.resolve(undefined);
    default:
      return Promise.reject(new Error(`Unexpected command: ${command}`));
  }
};

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockImplementation(answerCommand);
  });

  it('deletes the row and its file, and clears the image of the adventure and base entity that referenced it', async () => {
    const { remove } = await import('../remove');
    const { create: createAdventure, update: updateAdventure } =
      await import('@db/adventure');
    const { create: createBaseEntity, update: updateBaseEntity } =
      await import('@db/base-entity');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute(
      'INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)',
      ['image-1', 'png', '2026-01-10T09:00:00.000Z'],
    );
    const adventureId = await createAdventure();
    const baseEntityId = await createBaseEntity('npcs', adventureId);
    await updateAdventure(adventureId, { image_id: 'image-1' });
    await updateBaseEntity(baseEntityId, { image_id: 'image-1' });

    await remove('image-1');

    expect(await db.select<unknown[]>('SELECT id FROM images')).toEqual([]);
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

    await remove('missing-image');

    expect(invoke).not.toHaveBeenCalled();
  });
});
