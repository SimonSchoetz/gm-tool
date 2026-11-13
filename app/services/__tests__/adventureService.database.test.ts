// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Adventure } from '@db/adventure';

// Runs the real adventureService against the real in-memory database, with only the image file commands answered by a stand-in; adventureService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

vi.mock('@tauri-apps/api/core', async () => {
  const { answerHostCommand } = await import('./support/hostCommands');
  return { invoke: answerHostCommand };
});

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
});
