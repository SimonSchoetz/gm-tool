// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Adventure } from '@db/adventure';
import {
  testDatabase,
  writeFailingOnEachCall,
} from './support/failingDatabaseCall';
import {
  answerHostCommand,
  answerHostCommandFailing,
} from './support/hostCommands';

// Runs the real adventureService against the real in-memory database, with only the image file commands answered by a stand-in; adventureService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const invoke = vi.hoisted(() => vi.fn<(command: string) => Promise<unknown>>());
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const load = async () => {
  const adventureService = await import('@services/adventureService');
  const adventureDb = await import('@db/adventure');
  const baseEntityDb = await import('@db/base-entity');
  const encounterDb = await import('@db/encounter');
  const imageDb = await import('@db/image');
  const { getDatabase } = await import('@db/database');
  const select = async <T>(sql: string, values: unknown[] = []) =>
    (await getDatabase()).select<T>(sql, values);
  const createImage = () => imageDb.create({ filePath: '/pics/image.png' });
  const createImagedAdventure = async () => {
    const adventureId = await adventureDb.create();
    const imageId = await createImage();
    await adventureDb.update(adventureId, { image_id: imageId });
    return { adventureId, imageId };
  };
  return {
    db: await testDatabase(getDatabase),
    readImageIdsOfAdventureRows: async () =>
      (
        await select<{ image_id: string | null }[]>(
          'SELECT image_id FROM adventures UNION ALL SELECT image_id FROM base_entities UNION ALL SELECT image_id FROM encounters',
        )
      ).map((row) => row.image_id),
    adventureService,
    createImagedAdventure,
    createImagedBaseEntity: async (adventureId: string) => {
      const baseEntityId = await baseEntityDb.create('locations', adventureId);
      await baseEntityDb.update(baseEntityId, {
        image_id: await createImage(),
      });
    },
    createImagedEncounter: async (adventureId: string) => {
      const encounterId = await encounterDb.create(adventureId);
      await encounterDb.update(encounterId, { image_id: await createImage() });
    },
    readAdventureIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM adventures')).map(
        (row) => row.id,
      ),
    readImageIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM images')).map(
        (row) => row.id,
      ),
    readAdventure: async (id: string) =>
      (
        await select<Adventure[]>('SELECT * FROM adventures WHERE id = $1', [
          id,
        ])
      )[0],
  };
};

describe('adventureService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockReset().mockImplementation(answerHostCommand);
  });

  it('deletes an adventure with the images of its base entities and encounters, leaving only another adventure’s image', async () => {
    const {
      adventureService,
      createImagedAdventure,
      createImagedBaseEntity,
      createImagedEncounter,
      readImageIds,
    } = await load();
    const deleted = await createImagedAdventure();
    await createImagedBaseEntity(deleted.adventureId);
    await createImagedEncounter(deleted.adventureId);
    const kept = await createImagedAdventure();

    await adventureService.deleteAdventure(deleted.adventureId);

    expect(await readImageIds()).toEqual([kept.imageId]);
  });

  it('replaces an adventure’s image, pointing it at the new image row and removing the old one', async () => {
    const {
      adventureService,
      createImagedAdventure,
      readImageIds,
      readAdventure,
    } = await load();
    const { adventureId, imageId } = await createImagedAdventure();

    await adventureService.updateAdventure(adventureId, {
      image_id: imageId,
      imgFilePath: '/pics/new-image.jpg',
    });

    const { image_id: newImageId } = await readAdventure(adventureId);
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toEqual([newImageId]);
  });

  it('keeps the adventure pointing at a stored image, the old or the new, when any database call of an image replacement fails', async () => {
    const {
      adventureService,
      createImagedAdventure,
      readImageIds,
      readAdventure,
      db,
    } = await load();
    const { adventureId } = await createImagedAdventure();

    await writeFailingOnEachCall(
      db,
      async () => {
        const { image_id } = await readAdventure(adventureId);
        await adventureService.updateAdventure(adventureId, {
          image_id,
          imgFilePath: '/pics/new-image.jpg',
        });
      },
      async () => {
        const { image_id } = await readAdventure(adventureId);
        expect(await readImageIds()).toContain(image_id);
      },
    );
  });

  it('resolves with the adventure on the new image when the old image’s file cannot be deleted', async () => {
    const {
      adventureService,
      createImagedAdventure,
      readAdventure,
      readImageIds,
    } = await load();
    const { adventureId, imageId } = await createImagedAdventure();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await adventureService.updateAdventure(adventureId, {
      image_id: imageId,
      imgFilePath: '/pics/new-image.jpg',
    });

    const { image_id: newImageId } = await readAdventure(adventureId);
    expect(newImageId).not.toBeNull();
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toContain(imageId);
  });

  it('resolves with the adventure’s image emptied when the image’s file cannot be deleted', async () => {
    const { adventureService, createImagedAdventure, readAdventure } =
      await load();
    const { adventureId } = await createImagedAdventure();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await adventureService.removeAdventureImage(adventureId);

    expect((await readAdventure(adventureId)).image_id).toBeNull();
  });

  it('leaves the adventure either gone or whole, its rows still naming their images, when any database call of its deletion fails', async () => {
    const {
      adventureService,
      createImagedAdventure,
      createImagedBaseEntity,
      createImagedEncounter,
      readAdventureIds,
      readImageIdsOfAdventureRows,
      db,
    } = await load();
    const createWholeAdventure = async () => {
      const { adventureId } = await createImagedAdventure();
      await createImagedBaseEntity(adventureId);
      await createImagedEncounter(adventureId);
      return adventureId;
    };
    let adventureId = '';

    await writeFailingOnEachCall(
      db,
      () => adventureService.deleteAdventure(adventureId),
      async () => {
        if ((await readAdventureIds()).includes(adventureId)) {
          expect(await readImageIdsOfAdventureRows()).not.toContain(null);
        }
      },
      async () => {
        adventureId = await createWholeAdventure();
      },
    );
  });

  it('resolves with the adventure gone when an image’s file cannot be deleted', async () => {
    const { adventureService, createImagedAdventure, readAdventureIds } =
      await load();
    const { adventureId } = await createImagedAdventure();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await adventureService.deleteAdventure(adventureId);

    expect(await readAdventureIds()).not.toContain(adventureId);
  });
});
