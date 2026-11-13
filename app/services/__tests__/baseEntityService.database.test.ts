// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import {
  testDatabase,
  writeFailingOnEachCall,
} from './support/failingDatabaseCall';
import {
  answerHostCommand,
  answerHostCommandFailing,
} from './support/hostCommands';

// Runs the real baseEntityService against the real in-memory database, with only the image file commands answered by a stand-in; baseEntityService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const invoke = vi.hoisted(() => vi.fn<(command: string) => Promise<unknown>>());
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const load = async () => {
  const baseEntityService = await import('@services/baseEntityService');
  const adventureDb = await import('@db/adventure');
  const baseEntityDb = await import('@db/base-entity');
  const sectionDb = await import('@db/base-entity-content-section');
  const imageDb = await import('@db/image');
  const { getDatabase } = await import('@db/database');
  const select = async <T>(sql: string, values: unknown[] = []) =>
    (await getDatabase()).select<T>(sql, values);
  const adventureId = await adventureDb.create();
  const createImagedEntity = async () => {
    const baseEntityId = await baseEntityDb.create('npcs', adventureId);
    const imageId = await imageDb.create(
      { filePath: '/pics/portrait.png' },
      imageDb.generateImageId(),
    );
    await baseEntityDb.update(baseEntityId, { image_id: imageId });
    return { baseEntityId, imageId };
  };
  return {
    db: await testDatabase(getDatabase),
    countSections: async () =>
      (
        await select<{ count: number }[]>(
          'SELECT COUNT(*) AS count FROM base_entity_content_sections',
        )
      )[0].count,
    baseEntityService,
    sectionDb,
    createImagedEntity,
    readImageIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM images')).map(
        (row) => row.id,
      ),
    readEntityIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM base_entities')).map(
        (row) => row.id,
      ),
    readEntity: async (id: string) =>
      (
        await select<BaseEntity[]>(
          'SELECT * FROM base_entities WHERE id = $1',
          [id],
        )
      )[0],
    readSections: (baseEntityId: string) =>
      select<
        Pick<BaseEntityContentSection, 'type' | 'content' | 'sort_order'>[]
      >(
        'SELECT type, content, sort_order FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order',
        [baseEntityId],
      ),
  };
};

describe('baseEntityService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockReset().mockImplementation(answerHostCommand);
  });

  it('duplicates an entity so the copy points at a new image row and holds both content sections', async () => {
    const {
      baseEntityService,
      sectionDb,
      createImagedEntity,
      readImageIds,
      readEntity,
      readSections,
    } = await load();
    const { baseEntityId, imageId } = await createImagedEntity();
    const firstSectionId = await sectionDb.create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    await sectionDb.update(firstSectionId, { content: 'First' });
    const secondSectionId = await sectionDb.create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    await sectionDb.update(secondSectionId, { content: 'Second' });

    const copyId = await baseEntityService.duplicateBaseEntity(
      'npcs',
      baseEntityId,
    );

    const copy = await readEntity(copyId);
    expect(copy.image_id).not.toBe(imageId);
    expect((await readImageIds()).sort()).toEqual(
      [imageId, copy.image_id].sort(),
    );
    expect(await readSections(copyId)).toEqual([
      { type: 'text', content: 'First', sort_order: 0 },
      { type: 'text', content: 'Second', sort_order: 1 },
    ]);
  });

  it('deletes an entity together with its image row, leaving another entity and its image', async () => {
    const {
      baseEntityService,
      createImagedEntity,
      readImageIds,
      readEntityIds,
    } = await load();
    const deleted = await createImagedEntity();
    const kept = await createImagedEntity();

    await baseEntityService.deleteBaseEntity('npcs', deleted.baseEntityId);

    expect(await readEntityIds()).toEqual([kept.baseEntityId]);
    expect(await readImageIds()).toEqual([kept.imageId]);
  });

  it('replaces an entity’s image, pointing it at the new image row and removing the old one', async () => {
    const { baseEntityService, createImagedEntity, readImageIds, readEntity } =
      await load();
    const { baseEntityId, imageId } = await createImagedEntity();

    await baseEntityService.updateBaseEntity('npcs', baseEntityId, {
      image_id: imageId,
      imgFilePath: '/pics/new-portrait.jpg',
    });

    const { image_id: newImageId } = await readEntity(baseEntityId);
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toEqual([newImageId]);
  });

  it('leaves no copy and no copied section behind when any database call of a duplication fails', async () => {
    const {
      baseEntityService,
      sectionDb,
      createImagedEntity,
      readEntityIds,
      countSections,
      db,
    } = await load();
    const { baseEntityId } = await createImagedEntity();
    await sectionDb.create({ base_entity_id: baseEntityId, type: 'text' });
    await sectionDb.create({ base_entity_id: baseEntityId, type: 'text' });

    await writeFailingOnEachCall(
      db,
      () => baseEntityService.duplicateBaseEntity('npcs', baseEntityId),
      async () => {
        // Every entity, the source and each copy a run completed, holds its two sections: a failure in the copy leaves no copy, and one in the image bookkeeping after it leaves a whole one.
        expect(await countSections()).toBe(2 * (await readEntityIds()).length);
      },
    );
  });

  it('keeps the entity pointing at a stored image, the old or the new, when any database call of an image replacement fails', async () => {
    const {
      baseEntityService,
      createImagedEntity,
      readImageIds,
      readEntity,
      db,
    } = await load();
    const { baseEntityId } = await createImagedEntity();

    await writeFailingOnEachCall(
      db,
      async () => {
        const { image_id } = await readEntity(baseEntityId);
        await baseEntityService.updateBaseEntity('npcs', baseEntityId, {
          image_id,
          imgFilePath: '/pics/new-image.jpg',
        });
      },
      async () => {
        const { image_id } = await readEntity(baseEntityId);
        expect(await readImageIds()).toContain(image_id);
      },
    );
  });

  it('resolves with the entity on the new image, the old image row kept for the cleanup, when the old image’s file cannot be deleted', async () => {
    const { baseEntityService, createImagedEntity, readImageIds, readEntity } =
      await load();
    const { baseEntityId, imageId } = await createImagedEntity();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await baseEntityService.updateBaseEntity('npcs', baseEntityId, {
      image_id: imageId,
      imgFilePath: '/pics/new-image.jpg',
    });

    const { image_id: newImageId } = await readEntity(baseEntityId);
    expect(newImageId).not.toBeNull();
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toContain(imageId);
  });

  it('resolves with the entity’s image emptied when the image’s file cannot be deleted', async () => {
    const { baseEntityService, createImagedEntity, readEntity } = await load();
    const { baseEntityId } = await createImagedEntity();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await baseEntityService.removeBaseEntityImage('npcs', baseEntityId);

    expect((await readEntity(baseEntityId)).image_id).toBeNull();
  });

  it('leaves the entity either gone or still naming its image, when any database call of its deletion fails', async () => {
    const {
      baseEntityService,
      createImagedEntity,
      readImageIds,
      readEntity,
      readEntityIds,
      db,
    } = await load();
    let baseEntityId = '';

    await writeFailingOnEachCall(
      db,
      () => baseEntityService.deleteBaseEntity('npcs', baseEntityId),
      async () => {
        if ((await readEntityIds()).includes(baseEntityId)) {
          const { image_id } = await readEntity(baseEntityId);
          expect(await readImageIds()).toContain(image_id);
        }
      },
      async () => {
        ({ baseEntityId } = await createImagedEntity());
      },
    );
  });

  it('resolves with the entity gone when its image’s file cannot be deleted', async () => {
    const { baseEntityService, createImagedEntity, readEntityIds } =
      await load();
    const { baseEntityId } = await createImagedEntity();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await baseEntityService.deleteBaseEntity('npcs', baseEntityId);

    expect(await readEntityIds()).not.toContain(baseEntityId);
  });
});
