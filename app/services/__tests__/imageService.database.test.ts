// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  testDatabase,
  writeFailingOnEachCall,
} from './support/failingDatabaseCall';
import {
  answerHostCommand,
  answerHostCommandFailing,
} from './support/hostCommands';

// Runs the real imageService and its startup cleanup against the real in-memory database, with only the image file commands answered by a stand-in; imageService.test.ts mocks the db modules to test the service's own branching and error wrapping.

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

const PEER_UPDATED_AT = '2026-01-10T09:00:00.000Z';

const load = async () => {
  const imageService = await import('@services/imageService');
  const baseEntityService = await import('@services/baseEntityService');
  const adventureDb = await import('@db/adventure');
  const baseEntityDb = await import('@db/base-entity');
  const imageDb = await import('@db/image');
  const systemDb = await import('@db/_system');
  const syncDb = await import('@db/_sync');
  const { getDatabase } = await import('@db/database');
  const select = async <T>(sql: string, values: unknown[] = []) =>
    (await getDatabase()).select<T>(sql, values);
  const adventureId = await adventureDb.create();
  return {
    db: await testDatabase(getDatabase),
    imageService,
    baseEntityService,
    imageDb,
    systemDb,
    syncDb,
    createImagedEntity: async () => {
      const baseEntityId = await baseEntityDb.create('npcs', adventureId);
      const imageId = await imageDb.create(
        { filePath: '/pics/portrait.png' },
        imageDb.generateImageId(),
      );
      await baseEntityDb.update(baseEntityId, { image_id: imageId });
      return { baseEntityId, imageId };
    },
    readImageIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM images')).map(
        (row) => row.id,
      ),
    readUnreferencedImageIds: async () =>
      (
        await select<{ id: string }[]>(
          'SELECT id FROM images WHERE id NOT IN (SELECT image_id FROM adventures WHERE image_id IS NOT NULL UNION SELECT image_id FROM base_entities WHERE image_id IS NOT NULL UNION SELECT image_id FROM encounters WHERE image_id IS NOT NULL)',
        )
      ).map((row) => row.id),
    readEntityImageId: async (baseEntityId: string) =>
      (
        await select<{ image_id: string | null }[]>(
          'SELECT image_id FROM base_entities WHERE id = $1',
          [baseEntityId],
        )
      )[0].image_id,
  };
};

const deletedFileIds = () =>
  invoke.mock.calls
    .filter(([command]) => command === 'delete_image')
    .map(([, args]) => args?.id);

describe('the startup image cleanup against the database', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockReset().mockImplementation(answerHostCommand);
  });

  it('keeps an image a paired device sent that no entity names yet, because the entity naming it comes in a later sync batch', async () => {
    const { imageService, syncDb, readImageIds } = await load();
    await syncDb.applyUpsert(
      'images',
      {
        id: 'peer-image',
        file_extension: 'png',
        created_at: PEER_UPDATED_AT,
        updated_at: PEER_UPDATED_AT,
      },
      false,
    );

    await imageService.cleanUpAbandonedImages();

    expect(await readImageIds()).toEqual(['peer-image']);
    expect(deletedFileIds()).toEqual([]);
  });

  it('removes the row and file of an image a flow of this device recorded and left unnamed by a quit, keeps a recorded image an entity names, empties the record, and changes nothing when run again', async () => {
    const {
      imageService,
      imageDb,
      systemDb,
      createImagedEntity,
      readImageIds,
    } = await load();
    const { imageId: namedImageId } = await createImagedEntity();
    // The state a quit right after the new image was stored leaves: recorded, stored, named by no entity.
    const abandonedImageId = imageDb.generateImageId();
    await systemDb.addPendingImageIds([abandonedImageId, namedImageId]);
    await imageDb.create({ filePath: '/pics/new.png' }, abandonedImageId);

    await imageService.cleanUpAbandonedImages();

    expect(await readImageIds()).toEqual([namedImageId]);
    expect(deletedFileIds()).toEqual([abandonedImageId]);
    expect(await systemDb.getPendingImageIds()).toEqual([]);

    await imageService.cleanUpAbandonedImages();

    expect(await readImageIds()).toEqual([namedImageId]);
    expect(deletedFileIds()).toEqual([abandonedImageId]);
  });

  it('keeps a recorded image whose file could not be deleted recorded, and removes it at the next run', async () => {
    const { imageService, imageDb, systemDb, readImageIds } = await load();
    const abandonedImageId = imageDb.generateImageId();
    await systemDb.addPendingImageIds([abandonedImageId]);
    await imageDb.create({ filePath: '/pics/new.png' }, abandonedImageId);
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await imageService.cleanUpAbandonedImages();

    expect(await readImageIds()).toEqual([abandonedImageId]);
    expect(await systemDb.getPendingImageIds()).toEqual([abandonedImageId]);

    invoke.mockImplementation(answerHostCommand);
    await imageService.cleanUpAbandonedImages();

    expect(await readImageIds()).toEqual([]);
    expect(await systemDb.getPendingImageIds()).toEqual([]);
  });

  it('leaves no image that no entity names, and the entity on a stored image, once the cleanup has run after an image replacement that failed at any database call', async () => {
    const {
      db,
      imageService,
      baseEntityService,
      createImagedEntity,
      readImageIds,
      readUnreferencedImageIds,
      readEntityImageId,
    } = await load();
    const { baseEntityId } = await createImagedEntity();

    await writeFailingOnEachCall(
      db,
      async () => {
        await baseEntityService.updateBaseEntity('npcs', baseEntityId, {
          image_id: await readEntityImageId(baseEntityId),
          imgFilePath: '/pics/new.png',
        });
      },
      async () => {
        await imageService.cleanUpAbandonedImages();
        expect(await readUnreferencedImageIds()).toEqual([]);
        expect(await readImageIds()).toContain(
          await readEntityImageId(baseEntityId),
        );
      },
    );
  });
});
