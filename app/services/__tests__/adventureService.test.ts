import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as adventureDb from '@db/adventure';
import type * as baseEntityDb from '@db/base-entity';
import type * as encounterDb from '@db/encounter';
import type * as imageDb from '@db/image';
import type * as systemDb from '@db/_system';
import type * as imageReferencesDb from '@db/image-references';
import type { Adventure } from '@db/adventure';
import { BASE_ENTITY_TYPES } from '@domain';
import { buildBaseEntity } from './support/encounterQueueFixtures';
import { buildEncounter } from './support/encounterFixtures';

const getAdventure = vi.hoisted(() => vi.fn<typeof adventureDb.get>());
const getAllAdventureRows = vi.hoisted(() =>
  vi.fn<typeof adventureDb.getAll>(),
);
const createAdventureRow = vi.hoisted(() => vi.fn<typeof adventureDb.create>());
const removeAdventure = vi.hoisted(() => vi.fn<typeof adventureDb.remove>());
const updateAdventureRow = vi.hoisted(() => vi.fn<typeof adventureDb.update>());
const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityDb.getAll>(),
);
const getAllEncounters = vi.hoisted(() => vi.fn<typeof encounterDb.getAll>());
const removeImage = vi.hoisted(() => vi.fn<typeof imageDb.remove>());
const generateImageId = vi.hoisted(() =>
  vi.fn<typeof imageDb.generateImageId>(),
);
const addPendingImageIds = vi.hoisted(() =>
  vi.fn<typeof systemDb.addPendingImageIds>(),
);
const removePendingImageIds = vi.hoisted(() =>
  vi.fn<typeof systemDb.removePendingImageIds>(),
);
const isImageReferenced = vi.hoisted(() =>
  vi.fn<typeof imageReferencesDb.isImageReferenced>(),
);
const createImage = vi.hoisted(() => vi.fn<typeof imageDb.create>());

vi.mock('@db/adventure', () => ({
  get: getAdventure,
  getAll: getAllAdventureRows,
  create: createAdventureRow,
  remove: removeAdventure,
  update: updateAdventureRow,
}));
vi.mock('@db/base-entity', () => ({ getAll: getAllBaseEntities }));
vi.mock('@db/encounter', () => ({ getAll: getAllEncounters }));
vi.mock('@db/_system', () => ({
  addPendingImageIds,
  removePendingImageIds,
}));
vi.mock('@db/image-references', () => ({ isImageReferenced }));
vi.mock('@db/image', () => ({
  generateImageId,
  remove: removeImage,
  create: createImage,
}));
// The image lifecycle records each image it touches and removes those no entity names; here the new image is the one an entity names.
beforeEach(() => {
  generateImageId.mockReset().mockReturnValue('created-image');
  addPendingImageIds.mockReset().mockResolvedValue();
  removePendingImageIds.mockReset().mockResolvedValue();
  isImageReferenced
    .mockReset()
    .mockImplementation((id) => Promise.resolve(id === 'created-image'));
});

const ADVENTURE_ID = 'adventure-1';

const buildAdventure = (overrides: Partial<Adventure> = {}): Adventure => ({
  id: ADVENTURE_ID,
  name: null,
  description: null,
  image_id: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

// One base entity per type holds an image of its own, named for its type, in the adventure under test; the other adventure's rows hold images that must survive.
const armSpies = () => {
  removeAdventure.mockReset().mockResolvedValue();
  removeImage.mockReset().mockResolvedValue();
  getAllBaseEntities.mockReset().mockImplementation((entityType, adventureId) =>
    Promise.resolve([
      buildBaseEntity({
        id: `${entityType}-entity`,
        entity_type: entityType,
        image_id:
          adventureId === ADVENTURE_ID
            ? `${entityType}-image`
            : `other-${entityType}-image`,
      }),
    ]),
  );
  getAllEncounters.mockReset().mockImplementation((adventureId) =>
    Promise.resolve([
      buildEncounter({
        id: 'encounter-with-cover',
        image_id:
          adventureId === ADVENTURE_ID ? 'encounter-cover' : 'other-cover',
      }),
      buildEncounter({ id: 'encounter-without-cover', image_id: null }),
    ]),
  );
};

describe('deleteAdventure', () => {
  beforeEach(() => {
    vi.resetModules();
    armSpies();
  });

  it("removes the adventure, then the images of its base entities of every type, its encounters' covers and its own cover", async () => {
    const { deleteAdventure } = await import('../adventureService');

    getAdventure.mockResolvedValue(
      buildAdventure({ image_id: 'adventure-cover' }),
    );

    await deleteAdventure(ADVENTURE_ID);

    expect(removeImage.mock.calls.map(([imageId]) => imageId).sort()).toEqual(
      [
        ...BASE_ENTITY_TYPES.map((entityType) => `${entityType}-image`),
        'encounter-cover',
        'adventure-cover',
      ].sort(),
    );
    expect(removeAdventure).toHaveBeenCalledWith(ADVENTURE_ID);
    expect(removeAdventure.mock.invocationCallOrder[0]).toBeLessThan(
      Math.min(...removeImage.mock.invocationCallOrder),
    );
  });

  it('deletes no image of another adventure and none for a row or an adventure without an image', async () => {
    const { deleteAdventure } = await import('../adventureService');

    getAdventure.mockResolvedValue(buildAdventure());

    await deleteAdventure(ADVENTURE_ID);

    for (const [imageId] of removeImage.mock.calls) {
      expect(imageId).not.toMatch(/^other-/);
    }
    expect(removeImage).toHaveBeenCalledTimes(BASE_ENTITY_TYPES.length + 1);
    expect(getAllEncounters).toHaveBeenCalledWith(ADVENTURE_ID);
    for (const entityType of BASE_ENTITY_TYPES) {
      expect(getAllBaseEntities).toHaveBeenCalledWith(entityType, ADVENTURE_ID);
    }
  });

  it('resolves and still removes the later images when an image cannot be removed after the adventure is gone', async () => {
    const { deleteAdventure } = await import('../adventureService');
    getAdventure.mockResolvedValue(
      buildAdventure({ image_id: 'adventure-cover' }),
    );
    removeImage.mockRejectedValueOnce(new Error('disk locked'));

    await expect(deleteAdventure(ADVENTURE_ID)).resolves.toBeUndefined();

    expect(removeImage).toHaveBeenCalledTimes(BASE_ENTITY_TYPES.length + 2);
  });

  it('rejects as AdventureDeleteError and removes no image when the adventure cannot be removed', async () => {
    const { deleteAdventure } = await import('../adventureService');
    getAdventure.mockResolvedValue(
      buildAdventure({ image_id: 'adventure-cover' }),
    );
    removeAdventure.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockResolvedValue(true);

    await expect(deleteAdventure(ADVENTURE_ID)).rejects.toMatchObject({
      name: 'AdventureDeleteError',
    });

    expect(removeImage).not.toHaveBeenCalled();
  });
});

describe('updateAdventure', () => {
  beforeEach(() => {
    vi.resetModules();
    updateAdventureRow.mockReset().mockResolvedValue();
    createImage.mockReset().mockResolvedValue('created-image');
    removeImage.mockReset().mockResolvedValue();
  });

  it('stores the chosen file as a new cover, writes its id with the other data and without the file path, then removes the old cover', async () => {
    const { updateAdventure } = await import('../adventureService');

    await updateAdventure(ADVENTURE_ID, {
      imgFilePath: '/pick/map.png',
      image_id: 'adventure-cover',
      name: 'Renamed',
    });

    expect(createImage).toHaveBeenCalledWith(
      { filePath: '/pick/map.png' },
      'created-image',
    );
    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      image_id: 'created-image',
      name: 'Renamed',
    });
    expect(removeImage).toHaveBeenCalledWith('adventure-cover');
    expect(updateAdventureRow.mock.invocationCallOrder[0]).toBeLessThan(
      removeImage.mock.invocationCallOrder[0],
    );
  });

  it('rejects as AdventureUpdateError and keeps the old cover when the adventure cannot be pointed at the new one', async () => {
    const { updateAdventure } = await import('../adventureService');
    updateAdventureRow.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockImplementation((id) =>
      Promise.resolve(id === 'adventure-cover'),
    );

    await expect(
      updateAdventure(ADVENTURE_ID, {
        imgFilePath: '/pick/map.png',
        image_id: 'adventure-cover',
      }),
    ).rejects.toMatchObject({ name: 'AdventureUpdateError' });

    expect(removeImage.mock.calls).toEqual([['created-image']]);
  });

  it('creates a cover from the chosen file when the adventure has none', async () => {
    const { updateAdventure } = await import('../adventureService');

    await updateAdventure(ADVENTURE_ID, {
      imgFilePath: '/pick/map.png',
      image_id: null,
    });

    expect(createImage).toHaveBeenCalledWith(
      { filePath: '/pick/map.png' },
      'created-image',
    );
    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      image_id: 'created-image',
    });
    expect(removeImage).not.toHaveBeenCalled();
  });
});

describe('getAllAdventures', () => {
  beforeEach(() => {
    vi.resetModules();
    getAllAdventureRows.mockReset().mockResolvedValue([]);
  });

  it('returns every adventure', async () => {
    const { getAllAdventures } = await import('../adventureService');
    const adventures = [
      buildAdventure({ id: 'a' }),
      buildAdventure({ id: 'b' }),
    ];
    getAllAdventureRows.mockResolvedValue(adventures);

    await expect(getAllAdventures()).resolves.toEqual(adventures);
  });

  it('rejects as AdventureLoadError when the load fails', async () => {
    const { getAllAdventures } = await import('../adventureService');
    getAllAdventureRows.mockRejectedValue(new Error('disk'));

    await expect(getAllAdventures()).rejects.toMatchObject({
      name: 'AdventureLoadError',
    });
  });
});

describe('getAdventureById', () => {
  beforeEach(() => {
    vi.resetModules();
    getAdventure.mockReset().mockResolvedValue(null);
  });

  it('returns the adventure', async () => {
    const { getAdventureById } = await import('../adventureService');
    const adventure = buildAdventure({ id: 'found' });
    getAdventure.mockResolvedValue(adventure);

    await expect(getAdventureById('found')).resolves.toEqual(adventure);
    expect(getAdventure).toHaveBeenCalledWith('found');
  });

  it('rejects as AdventureNotFoundError when there is no such adventure', async () => {
    const { getAdventureById } = await import('../adventureService');

    await expect(getAdventureById('missing')).rejects.toMatchObject({
      name: 'AdventureNotFoundError',
    });
  });
});

describe('createAdventure', () => {
  beforeEach(() => {
    vi.resetModules();
    createAdventureRow.mockReset().mockResolvedValue('new-adventure');
  });

  it('resolves the id of the created adventure', async () => {
    const { createAdventure } = await import('../adventureService');

    await expect(createAdventure()).resolves.toBe('new-adventure');
  });

  it('rejects as AdventureCreateError when the creation fails', async () => {
    const { createAdventure } = await import('../adventureService');
    createAdventureRow.mockRejectedValue(new Error('disk'));

    await expect(createAdventure()).rejects.toMatchObject({
      name: 'AdventureCreateError',
    });
  });
});

describe('updateAdventure without a chosen file', () => {
  beforeEach(() => {
    vi.resetModules();
    updateAdventureRow.mockReset().mockResolvedValue();
    createImage.mockReset().mockResolvedValue('created-image');
  });

  it('writes the data unchanged, keeping the existing image_id and touching no image', async () => {
    const { updateAdventure } = await import('../adventureService');

    await updateAdventure(ADVENTURE_ID, { name: 'Renamed', image_id: 'kept' });

    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      name: 'Renamed',
      image_id: 'kept',
    });
    expect(createImage).not.toHaveBeenCalled();
  });

  it('rejects as AdventureUpdateError and writes nothing when the image save fails', async () => {
    const { updateAdventure } = await import('../adventureService');
    createImage.mockRejectedValue(new Error('disk'));

    await expect(
      updateAdventure(ADVENTURE_ID, { imgFilePath: '/pick/map.png' }),
    ).rejects.toMatchObject({ name: 'AdventureUpdateError' });

    expect(updateAdventureRow).not.toHaveBeenCalled();
  });
});

describe('removeAdventureImage', () => {
  beforeEach(() => {
    vi.resetModules();
    getAdventure
      .mockReset()
      .mockResolvedValue(buildAdventure({ image_id: 'adventure-cover' }));
    removeImage.mockReset().mockResolvedValue();
    updateAdventureRow.mockReset().mockResolvedValue();
  });

  it('clears image_id, then deletes the cover image', async () => {
    const { removeAdventureImage } = await import('../adventureService');

    await removeAdventureImage(ADVENTURE_ID);

    expect(removeImage).toHaveBeenCalledWith('adventure-cover');
    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      image_id: null,
    });
    expect(updateAdventureRow.mock.invocationCallOrder[0]).toBeLessThan(
      removeImage.mock.invocationCallOrder[0],
    );
  });

  it('deletes nothing and writes nothing when the adventure has no cover', async () => {
    const { removeAdventureImage } = await import('../adventureService');
    getAdventure.mockResolvedValue(buildAdventure({ image_id: null }));

    await removeAdventureImage(ADVENTURE_ID);

    expect(removeImage).not.toHaveBeenCalled();
    expect(updateAdventureRow).not.toHaveBeenCalled();
  });

  it('resolves when the image cannot be deleted after image_id is cleared', async () => {
    const { removeAdventureImage } = await import('../adventureService');
    removeImage.mockRejectedValue(new Error('disk locked'));

    await expect(removeAdventureImage(ADVENTURE_ID)).resolves.toBeUndefined();
  });

  it('rejects as AdventureUpdateError and deletes no image when image_id cannot be cleared', async () => {
    const { removeAdventureImage } = await import('../adventureService');
    updateAdventureRow.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockResolvedValue(true);

    await expect(removeAdventureImage(ADVENTURE_ID)).rejects.toMatchObject({
      name: 'AdventureUpdateError',
    });

    expect(removeImage).not.toHaveBeenCalled();
  });
});
