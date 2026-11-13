import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as encounterDb from '@db/encounter';
import type * as queueItemDb from '@db/encounter-queue-item';
import type * as logEntryDb from '@db/encounter-log-entry';
import type * as imageDb from '@db/image';
import type * as systemDb from '@db/_system';
import type * as imageReferencesDb from '@db/image-references';
import { buildEncounterQueueItem } from './support/encounterQueueFixtures';
import { buildEncounter } from './support/encounterFixtures';

const getEncounter = vi.hoisted(() => vi.fn<typeof encounterDb.get>());
const getAllEncounterRows = vi.hoisted(() =>
  vi.fn<typeof encounterDb.getAll>(),
);
const createEncounterRow = vi.hoisted(() => vi.fn<typeof encounterDb.create>());
const duplicate = vi.hoisted(() => vi.fn<typeof encounterDb.duplicate>());
const updateEncounterRow = vi.hoisted(() => vi.fn<typeof encounterDb.update>());
const removeEncounter = vi.hoisted(() => vi.fn<typeof encounterDb.remove>());
const duplicateImage = vi.hoisted(() => vi.fn<typeof imageDb.duplicate>());
const createImage = vi.hoisted(() => vi.fn<typeof imageDb.create>());
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
const getAllQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.getAllByEncounter>(),
);
const duplicateByEncounter = vi.hoisted(() =>
  vi.fn<typeof queueItemDb.duplicateByEncounter>(),
);
const getAllLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryDb.getAllByEncounter>(),
);

vi.mock('@db/encounter', () => ({
  get: getEncounter,
  getAll: getAllEncounterRows,
  create: createEncounterRow,
  duplicate,
  update: updateEncounterRow,
  remove: removeEncounter,
}));
vi.mock('@db/_system', () => ({
  addPendingImageIds,
  removePendingImageIds,
}));
vi.mock('@db/image-references', () => ({ isImageReferenced }));
vi.mock('@db/image', () => ({
  generateImageId,
  duplicate: duplicateImage,
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

vi.mock('@db/encounter-queue-item', () => ({
  getAllByEncounter: getAllQueueItems,
  duplicateByEncounter,
}));
vi.mock('@db/encounter-log-entry', () => ({
  getAllByEncounter: getAllLogEntries,
}));
vi.mock('@db/base-entity', () => ({}));
vi.mock('@db/base-entity-content-section', () => ({}));

const resetSpies = () => {
  getAllEncounterRows.mockReset().mockResolvedValue([]);
  createEncounterRow.mockReset().mockResolvedValue('created-encounter');
  getEncounter.mockReset().mockResolvedValue(buildEncounter({ id: 'source' }));
  duplicate.mockReset().mockResolvedValue('new-encounter');
  updateEncounterRow.mockReset().mockResolvedValue();
  removeEncounter.mockReset().mockResolvedValue();
  duplicateImage.mockReset().mockResolvedValue('copied-image');
  createImage.mockReset().mockResolvedValue('created-image');
  removeImage.mockReset().mockResolvedValue();
  getAllQueueItems
    .mockReset()
    .mockResolvedValue([buildEncounterQueueItem({ id: 'a' })]);
  getAllLogEntries.mockReset().mockResolvedValue([]);
  duplicateByEncounter.mockReset().mockResolvedValue();
};

describe('duplicateEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('copies the source cover first, creates the encounter with the copy, then copies the queue and resolves the new id', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );

    await expect(duplicateEncounter('source')).resolves.toBe('new-encounter');

    expect(duplicateImage).toHaveBeenCalledWith(
      'source-image',
      'created-image',
    );
    expect(duplicate).toHaveBeenCalledWith('source', 'created-image');
    expect(duplicateByEncounter).toHaveBeenCalledWith(
      'source',
      'new-encounter',
      new Map([['a', null]]),
    );
    expect(duplicateImage.mock.invocationCallOrder[0]).toBeLessThan(
      duplicate.mock.invocationCallOrder[0],
    );
    expect(duplicate.mock.invocationCallOrder[0]).toBeLessThan(
      duplicateByEncounter.mock.invocationCallOrder[0],
    );
  });

  it('gives the copy no cover and copies no image when the source has none', async () => {
    const { duplicateEncounter } = await import('../encounterService');

    await duplicateEncounter('source');

    expect(duplicate).toHaveBeenCalledWith('source', null);
    expect(duplicateImage).not.toHaveBeenCalled();
  });

  it('rejects as EncounterDuplicateError and creates no encounter when the cover copy fails', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    duplicateImage.mockRejectedValue(new Error('disk full'));

    await expect(duplicateEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDuplicateError',
    });

    expect(duplicate).not.toHaveBeenCalled();
    expect(removeEncounter).not.toHaveBeenCalled();
  });

  it('rejects as EncounterDuplicateError naming the queue copy’s failure, and removes the new encounter, when the queue copy fails', async () => {
    const { duplicateEncounter } = await import('../encounterService');
    duplicateByEncounter.mockRejectedValue(new Error('disk full'));

    await expect(duplicateEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDuplicateError',
      message: expect.stringContaining('disk full') as unknown,
    });
    expect(removeEncounter).toHaveBeenCalledWith('new-encounter');
  });
});

describe('deleteEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('deletes the encounter row before the cover image', async () => {
    const { deleteEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );

    await deleteEncounter('source');

    expect(removeImage).toHaveBeenCalledWith('source-image');
    expect(removeEncounter).toHaveBeenCalledWith('source');
    expect(removeEncounter.mock.invocationCallOrder[0]).toBeLessThan(
      removeImage.mock.invocationCallOrder[0],
    );
  });

  it('deletes only the encounter row when it has no cover', async () => {
    const { deleteEncounter } = await import('../encounterService');

    await deleteEncounter('source');

    expect(removeImage).not.toHaveBeenCalled();
    expect(removeEncounter).toHaveBeenCalledWith('source');
  });

  it('resolves when the cover cannot be deleted after the encounter is gone', async () => {
    const { deleteEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    removeImage.mockRejectedValue(new Error('disk locked'));

    await expect(deleteEncounter('source')).resolves.toBeUndefined();
  });

  it('rejects as EncounterDeleteError and deletes no cover when the encounter cannot be deleted', async () => {
    const { deleteEncounter } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    removeEncounter.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockResolvedValue(true);

    await expect(deleteEncounter('source')).rejects.toMatchObject({
      name: 'EncounterDeleteError',
    });

    expect(removeImage).not.toHaveBeenCalled();
  });
});

describe('updateEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('creates an image from the chosen file and writes its id as image_id, without the file path', async () => {
    const { updateEncounter } = await import('../encounterService');

    await updateEncounter('source', {
      imgFilePath: '/pick/map.png',
      image_id: null,
    });

    expect(createImage).toHaveBeenCalledWith(
      { filePath: '/pick/map.png' },
      'created-image',
    );
    expect(updateEncounterRow).toHaveBeenCalledWith('source', {
      image_id: 'created-image',
    });
  });

  it('stores the chosen file as a new cover, writes its id, then deletes the old cover', async () => {
    const { updateEncounter } = await import('../encounterService');

    await updateEncounter('source', {
      imgFilePath: '/pick/map.png',
      image_id: 'source-image',
    });

    expect(createImage).toHaveBeenCalledWith(
      { filePath: '/pick/map.png' },
      'created-image',
    );
    expect(updateEncounterRow).toHaveBeenCalledWith('source', {
      image_id: 'created-image',
    });
    expect(removeImage).toHaveBeenCalledWith('source-image');
    expect(updateEncounterRow.mock.invocationCallOrder[0]).toBeLessThan(
      removeImage.mock.invocationCallOrder[0],
    );
  });

  it('rejects as EncounterUpdateError and keeps the old cover when the encounter cannot be pointed at the new one', async () => {
    const { updateEncounter } = await import('../encounterService');
    updateEncounterRow.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockImplementation((id) =>
      Promise.resolve(id === 'source-image'),
    );

    await expect(
      updateEncounter('source', {
        imgFilePath: '/pick/map.png',
        image_id: 'source-image',
      }),
    ).rejects.toMatchObject({ name: 'EncounterUpdateError' });

    expect(removeImage.mock.calls).toEqual([['created-image']]);
  });

  it('writes the data unchanged and touches no image when no file is chosen', async () => {
    const { updateEncounter } = await import('../encounterService');

    await updateEncounter('source', {
      name: 'Ambush',
      image_id: 'source-image',
    });

    expect(updateEncounterRow).toHaveBeenCalledWith('source', {
      name: 'Ambush',
      image_id: 'source-image',
    });
    expect(createImage).not.toHaveBeenCalled();
  });

  it('rejects as EncounterUpdateError and writes nothing when the image save fails', async () => {
    const { updateEncounter } = await import('../encounterService');
    createImage.mockRejectedValue(new Error('disk full'));

    await expect(
      updateEncounter('source', { imgFilePath: '/pick/map.png' }),
    ).rejects.toMatchObject({ name: 'EncounterUpdateError' });

    expect(updateEncounterRow).not.toHaveBeenCalled();
  });
});

describe('removeEncounterImage', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('clears image_id, then deletes the cover image', async () => {
    const { removeEncounterImage } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );

    await removeEncounterImage('source');

    expect(removeImage).toHaveBeenCalledWith('source-image');
    expect(updateEncounterRow).toHaveBeenCalledWith('source', {
      image_id: null,
    });
    expect(updateEncounterRow.mock.invocationCallOrder[0]).toBeLessThan(
      removeImage.mock.invocationCallOrder[0],
    );
  });

  it('deletes nothing and writes nothing when the encounter has no cover', async () => {
    const { removeEncounterImage } = await import('../encounterService');

    await removeEncounterImage('source');

    expect(removeImage).not.toHaveBeenCalled();
    expect(updateEncounterRow).not.toHaveBeenCalled();
  });

  it('resolves when the image cannot be deleted after image_id is cleared', async () => {
    const { removeEncounterImage } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    removeImage.mockRejectedValue(new Error('disk locked'));

    await expect(removeEncounterImage('source')).resolves.toBeUndefined();
  });

  it('rejects as EncounterUpdateError and deletes no image when image_id cannot be cleared', async () => {
    const { removeEncounterImage } = await import('../encounterService');
    getEncounter.mockResolvedValue(
      buildEncounter({ id: 'source', image_id: 'source-image' }),
    );
    updateEncounterRow.mockRejectedValue(new Error('locked'));
    isImageReferenced.mockResolvedValue(true);

    await expect(removeEncounterImage('source')).rejects.toMatchObject({
      name: 'EncounterUpdateError',
    });

    expect(removeImage).not.toHaveBeenCalled();
  });
});

describe('getAllEncounters', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it("returns the adventure's encounters", async () => {
    const { getAllEncounters } = await import('../encounterService');
    const encounters = [
      buildEncounter({ id: 'a' }),
      buildEncounter({ id: 'b' }),
    ];
    getAllEncounterRows.mockResolvedValue(encounters);

    await expect(getAllEncounters('adventure-9')).resolves.toEqual(encounters);
    expect(getAllEncounterRows).toHaveBeenCalledWith('adventure-9');
  });

  it('rejects as EncounterLoadError when the load fails', async () => {
    const { getAllEncounters } = await import('../encounterService');
    getAllEncounterRows.mockRejectedValue(new Error('disk'));

    await expect(getAllEncounters('adventure-9')).rejects.toMatchObject({
      name: 'EncounterLoadError',
    });
  });
});

describe('getEncounterById', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('returns the encounter', async () => {
    const { getEncounterById } = await import('../encounterService');
    const encounter = buildEncounter({ id: 'found' });
    getEncounter.mockResolvedValue(encounter);

    await expect(getEncounterById('found')).resolves.toEqual(encounter);
    expect(getEncounter).toHaveBeenCalledWith('found');
  });

  it('rejects as EncounterNotFoundError when there is no such encounter', async () => {
    const { getEncounterById } = await import('../encounterService');
    getEncounter.mockResolvedValue(null);

    await expect(getEncounterById('missing')).rejects.toMatchObject({
      name: 'EncounterNotFoundError',
    });
  });

  it('rejects as EncounterLoadError, not as not found, when the load fails', async () => {
    const { getEncounterById } = await import('../encounterService');
    getEncounter.mockRejectedValue(new Error('disk'));

    await expect(getEncounterById('any')).rejects.toMatchObject({
      name: 'EncounterLoadError',
    });
  });
});

describe('createEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    resetSpies();
  });

  it('creates the encounter in the adventure and resolves its id', async () => {
    const { createEncounter } = await import('../encounterService');

    await expect(createEncounter('adventure-9')).resolves.toBe(
      'created-encounter',
    );
    expect(createEncounterRow).toHaveBeenCalledWith('adventure-9');
  });

  it('rejects as EncounterCreateError when the creation fails', async () => {
    const { createEncounter } = await import('../encounterService');
    createEncounterRow.mockRejectedValue(new Error('disk'));

    await expect(createEncounter('adventure-9')).rejects.toMatchObject({
      name: 'EncounterCreateError',
    });
  });
});
