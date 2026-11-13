import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as baseEntityDb from '@db/base-entity';
import type * as sectionDb from '@db/base-entity-content-section';
import type * as imageServiceModule from '@services/imageService';
import { buildBaseEntity } from './support/encounterQueueFixtures';

const getAll = vi.hoisted(() => vi.fn<typeof baseEntityDb.getAll>());
const get = vi.hoisted(() => vi.fn<typeof baseEntityDb.get>());
const create = vi.hoisted(() => vi.fn<typeof baseEntityDb.create>());
const update = vi.hoisted(() => vi.fn<typeof baseEntityDb.update>());
const remove = vi.hoisted(() => vi.fn<typeof baseEntityDb.remove>());
const duplicate = vi.hoisted(() => vi.fn<typeof baseEntityDb.duplicate>());
const duplicateByBaseEntity = vi.hoisted(() =>
  vi.fn<typeof sectionDb.duplicateByBaseEntity>(),
);
const saveImage = vi.hoisted(() =>
  vi.fn<typeof imageServiceModule.saveImage>(),
);
const removeImage = vi.hoisted(() =>
  vi.fn<typeof imageServiceModule.removeImage>(),
);
const deleteWithImages = vi.hoisted(() =>
  vi.fn<typeof imageServiceModule.deleteWithImages>(),
);
const duplicateWithImage = vi.hoisted(() =>
  vi.fn<typeof imageServiceModule.duplicateWithImage>(),
);

vi.mock('@db/base-entity', () => ({
  getAll,
  get,
  create,
  update,
  remove,
  duplicate,
}));
vi.mock('@db/base-entity-content-section', () => ({ duplicateByBaseEntity }));
vi.mock('@services/imageService', () => ({
  saveImage,
  removeImage,
  deleteWithImages,
  duplicateWithImage,
}));

beforeEach(() => {
  vi.resetModules();
  getAll.mockReset().mockResolvedValue([]);
  get.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue('new-entity');
  update.mockReset().mockResolvedValue();
  remove.mockReset().mockResolvedValue();
  duplicate.mockReset().mockResolvedValue('copy-entity');
  duplicateByBaseEntity.mockReset().mockResolvedValue();
  saveImage
    .mockReset()
    .mockImplementation((_currentImageId, _filePath, pointEntityAt) =>
      pointEntityAt('saved-image'),
    );
  removeImage
    .mockReset()
    .mockImplementation((_imageId, detachFromEntity) => detachFromEntity());
  deleteWithImages
    .mockReset()
    .mockImplementation((_imageIds, deleteEntity) => deleteEntity());
  duplicateWithImage
    .mockReset()
    .mockImplementation((sourceImageId, duplicateEntity) =>
      duplicateEntity(sourceImageId === null ? null : 'copied-image'),
    );
});

describe('getAllBaseEntities', () => {
  it('returns the entities of the type in the adventure', async () => {
    const { getAllBaseEntities } = await import('../baseEntityService');
    const entities = [buildBaseEntity({ id: 'a' })];
    getAll.mockResolvedValue(entities);

    await expect(getAllBaseEntities('foes', 'adventure-1')).resolves.toEqual(
      entities,
    );
    expect(getAll).toHaveBeenCalledWith('foes', 'adventure-1');
  });

  it('rejects as BaseEntityLoadError naming the type when the load fails', async () => {
    const { getAllBaseEntities } = await import('../baseEntityService');
    getAll.mockRejectedValue(new Error('disk'));

    await expect(
      getAllBaseEntities('foes', 'adventure-1'),
    ).rejects.toMatchObject({
      name: 'BaseEntityLoadError',
      message: 'Failed to load Foes: Error: disk',
    });
  });
});

describe('getBaseEntityById', () => {
  it('returns the entity', async () => {
    const { getBaseEntityById } = await import('../baseEntityService');
    const entity = buildBaseEntity({ id: 'found' });
    get.mockResolvedValue(entity);

    await expect(getBaseEntityById('npcs', 'found')).resolves.toEqual(entity);
    expect(get).toHaveBeenCalledWith('npcs', 'found');
  });

  it('rejects as BaseEntityNotFoundError when there is no such entity', async () => {
    const { getBaseEntityById } = await import('../baseEntityService');

    await expect(getBaseEntityById('npcs', 'missing')).rejects.toMatchObject({
      name: 'BaseEntityNotFoundError',
    });
  });

  it('rejects as BaseEntityLoadError, not as not found, when the load fails', async () => {
    const { getBaseEntityById } = await import('../baseEntityService');
    get.mockRejectedValue(new Error('disk'));

    await expect(getBaseEntityById('npcs', 'any')).rejects.toMatchObject({
      name: 'BaseEntityLoadError',
    });
  });
});

describe('createBaseEntity', () => {
  it('creates the entity of the type in the adventure and returns its id', async () => {
    const { createBaseEntity } = await import('../baseEntityService');

    await expect(createBaseEntity('pcs', 'adventure-1')).resolves.toBe(
      'new-entity',
    );
    expect(create).toHaveBeenCalledWith('pcs', 'adventure-1');
  });

  it('rejects as BaseEntityCreateError when the creation fails', async () => {
    const { createBaseEntity } = await import('../baseEntityService');
    create.mockRejectedValue(new Error('disk'));

    await expect(createBaseEntity('pcs', 'adventure-1')).rejects.toMatchObject({
      name: 'BaseEntityCreateError',
    });
  });
});

describe('updateBaseEntity', () => {
  it('saves the image file in place of the entity image, writing the saved image id with the other data and without the file path', async () => {
    const { updateBaseEntity } = await import('../baseEntityService');

    await updateBaseEntity('npcs', 'n1', {
      name: 'Renamed',
      image_id: 'old-image',
      imgFilePath: '/tmp/new.png',
    });

    expect(saveImage).toHaveBeenCalledWith(
      'old-image',
      '/tmp/new.png',
      expect.any(Function),
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('n1', {
      name: 'Renamed',
      image_id: 'saved-image',
    });
  });

  it('saves the image file for an entity without an image, as a new one', async () => {
    const { updateBaseEntity } = await import('../baseEntityService');

    await updateBaseEntity('npcs', 'n1', { imgFilePath: '/tmp/new.png' });

    expect(saveImage).toHaveBeenCalledWith(
      null,
      '/tmp/new.png',
      expect.any(Function),
    );
    expect(update).toHaveBeenCalledWith('n1', { image_id: 'saved-image' });
  });

  it('updates the row with the data as given, saving no image, when there is no image file path', async () => {
    const { updateBaseEntity } = await import('../baseEntityService');

    await updateBaseEntity('npcs', 'n1', { name: 'Renamed', image_id: 'kept' });

    expect(saveImage).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith('n1', {
      name: 'Renamed',
      image_id: 'kept',
    });
  });

  it('rejects as BaseEntityUpdateError, updating no row, when the image cannot be saved, and when the update fails', async () => {
    const { updateBaseEntity } = await import('../baseEntityService');
    saveImage.mockRejectedValueOnce(new Error('disk'));

    await expect(
      updateBaseEntity('npcs', 'n1', { imgFilePath: '/tmp/new.png' }),
    ).rejects.toMatchObject({ name: 'BaseEntityUpdateError' });
    expect(update).not.toHaveBeenCalled();

    update.mockRejectedValueOnce(new Error('disk'));

    await expect(updateBaseEntity('npcs', 'n1', {})).rejects.toMatchObject({
      name: 'BaseEntityUpdateError',
    });
  });
});

describe('removeBaseEntityImage', () => {
  it('removes the image by clearing the image id of the entity', async () => {
    const { removeBaseEntityImage } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ id: 'n1', image_id: 'image-1' }));

    await removeBaseEntityImage('npcs', 'n1');

    expect(removeImage).toHaveBeenCalledWith('image-1', expect.any(Function));
    expect(update).toHaveBeenCalledWith('n1', { image_id: null });
  });

  it('does nothing for an entity without an image', async () => {
    const { removeBaseEntityImage } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ image_id: null }));

    await removeBaseEntityImage('npcs', 'n1');

    expect(removeImage).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects as BaseEntityNotFoundError for an entity that does not exist', async () => {
    const { removeBaseEntityImage } = await import('../baseEntityService');

    await expect(removeBaseEntityImage('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityNotFoundError',
    });
  });

  it('rejects as BaseEntityUpdateError when the image id cannot be cleared', async () => {
    const { removeBaseEntityImage } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ image_id: 'image-1' }));
    update.mockRejectedValueOnce(new Error('disk'));

    await expect(removeBaseEntityImage('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityUpdateError',
    });
  });
});

describe('deleteBaseEntity', () => {
  it('removes the row together with the image of the entity', async () => {
    const { deleteBaseEntity } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ id: 'n1', image_id: 'image-1' }));

    await deleteBaseEntity('npcs', 'n1');

    expect(deleteWithImages).toHaveBeenCalledWith(
      ['image-1'],
      expect.any(Function),
    );
    expect(remove).toHaveBeenCalledWith('n1');
  });

  it('removes the row of an entity without an image, with no image', async () => {
    const { deleteBaseEntity } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ id: 'n1', image_id: null }));

    await deleteBaseEntity('npcs', 'n1');

    expect(deleteWithImages).toHaveBeenCalledWith([], expect.any(Function));
    expect(remove).toHaveBeenCalledWith('n1');
  });

  it('rejects as BaseEntityDeleteError, removing no row, when the entity is missing', async () => {
    const { deleteBaseEntity } = await import('../baseEntityService');

    await expect(deleteBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDeleteError',
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('rejects as BaseEntityDeleteError when the row cannot be removed', async () => {
    const { deleteBaseEntity } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ image_id: 'image-1' }));
    remove.mockRejectedValue(new Error('disk'));

    await expect(deleteBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDeleteError',
    });
  });
});

describe('duplicateBaseEntity', () => {
  it('duplicates the row with the copied image, then the content sections onto the copy', async () => {
    const { duplicateBaseEntity } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ id: 'n1', image_id: 'image-1' }));

    await expect(duplicateBaseEntity('npcs', 'n1')).resolves.toBe(
      'copy-entity',
    );

    expect(duplicateWithImage).toHaveBeenCalledWith(
      'image-1',
      expect.any(Function),
    );
    expect(duplicate).toHaveBeenCalledWith('npcs', 'n1', 'copied-image');
    expect(duplicateByBaseEntity).toHaveBeenCalledWith('n1', 'copy-entity');
    expect(duplicate.mock.invocationCallOrder[0]).toBeLessThan(
      duplicateByBaseEntity.mock.invocationCallOrder[0],
    );
  });

  it('duplicates an entity without an image with no image', async () => {
    const { duplicateBaseEntity } = await import('../baseEntityService');
    get.mockResolvedValue(buildBaseEntity({ image_id: null }));

    await duplicateBaseEntity('npcs', 'n1');

    expect(duplicateWithImage).toHaveBeenCalledWith(null, expect.any(Function));
    expect(duplicate).toHaveBeenCalledWith('npcs', 'n1', null);
  });

  it('rejects as BaseEntityDuplicateError, copying nothing further, when the entity is missing, the image or the row cannot be copied, or the sections cannot be copied', async () => {
    const { duplicateBaseEntity } = await import('../baseEntityService');

    await expect(duplicateBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDuplicateError',
    });
    expect(duplicate).not.toHaveBeenCalled();

    get.mockResolvedValue(buildBaseEntity({ image_id: 'image-1' }));
    duplicateWithImage.mockRejectedValueOnce(new Error('disk'));

    await expect(duplicateBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDuplicateError',
    });
    expect(duplicate).not.toHaveBeenCalled();

    duplicate.mockRejectedValueOnce(new Error('disk'));

    await expect(duplicateBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDuplicateError',
    });
    expect(duplicateByBaseEntity).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();

    duplicateByBaseEntity.mockRejectedValueOnce(new Error('sections'));

    await expect(duplicateBaseEntity('npcs', 'n1')).rejects.toMatchObject({
      name: 'BaseEntityDuplicateError',
      message: expect.stringContaining('sections') as unknown,
    });
    expect(remove).toHaveBeenCalledWith('copy-entity');
  });
});
