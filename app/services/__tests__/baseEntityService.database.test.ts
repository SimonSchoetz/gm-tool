// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';

// Runs the real baseEntityService against the real in-memory database, with only the image file commands answered by a stand-in; baseEntityService.test.ts mocks the db modules to test the service's own branching and error wrapping.

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
    const imageId = await imageDb.create({ filePath: '/pics/portrait.png' });
    await baseEntityDb.update(baseEntityId, { image_id: imageId });
    return { baseEntityId, imageId };
  };
  return {
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
});
