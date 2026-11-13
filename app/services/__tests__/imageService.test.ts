import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as imageDb from '@db/image';
import type * as systemDb from '@db/_system';
import type * as imageReferencesDb from '@db/image-references';
import type { Image } from '@db/image';
import type {
  invoke as invokeType,
  convertFileSrc as convertType,
} from '@platform';

const get = vi.hoisted(() => vi.fn<typeof imageDb.get>());
const create = vi.hoisted(() => vi.fn<typeof imageDb.create>());
const remove = vi.hoisted(() => vi.fn<typeof imageDb.remove>());
const duplicate = vi.hoisted(() => vi.fn<typeof imageDb.duplicate>());
const update = vi.hoisted(() => vi.fn<typeof imageDb.update>());
const generateImageId = vi.hoisted(() =>
  vi.fn<typeof imageDb.generateImageId>(),
);
const addPendingImageIds = vi.hoisted(() =>
  vi.fn<typeof systemDb.addPendingImageIds>(),
);
const removePendingImageIds = vi.hoisted(() =>
  vi.fn<typeof systemDb.removePendingImageIds>(),
);
const getPendingImageIds = vi.hoisted(() =>
  vi.fn<typeof systemDb.getPendingImageIds>(),
);
const isImageReferenced = vi.hoisted(() =>
  vi.fn<typeof imageReferencesDb.isImageReferenced>(),
);
const invoke = vi.hoisted(() => vi.fn<typeof invokeType>());
const convertFileSrc = vi.hoisted(() => vi.fn<typeof convertType>());

vi.mock('@db/image', () => ({
  get,
  create,
  remove,
  duplicate,
  update,
  generateImageId,
}));
vi.mock('@db/_system', () => ({
  addPendingImageIds,
  removePendingImageIds,
  getPendingImageIds,
}));
vi.mock('@db/image-references', () => ({ isImageReferenced }));
vi.mock('@platform', () => ({ invoke, convertFileSrc }));

// The images an entity names, as isImageReferenced answers; a test's entity write changes it as the real row would.
let referenced = new Set<string>();

beforeEach(() => {
  vi.resetModules();
  referenced = new Set();
  get.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue('new-image');
  remove.mockReset().mockResolvedValue();
  duplicate.mockReset().mockResolvedValue('new-image');
  update.mockReset().mockResolvedValue();
  generateImageId.mockReset().mockReturnValue('new-image');
  addPendingImageIds.mockReset().mockResolvedValue();
  removePendingImageIds.mockReset().mockResolvedValue();
  getPendingImageIds.mockReset().mockResolvedValue([]);
  isImageReferenced
    .mockReset()
    .mockImplementation((id) => Promise.resolve(referenced.has(id)));
  invoke.mockReset().mockResolvedValue('/store/images/a.png');
  convertFileSrc.mockReset().mockImplementation((path) => `asset://${path}`);
});

const unrecordedIds = () => removePendingImageIds.mock.calls.flat(2);

describe('saveImage', () => {
  const pointEntityAtNewImage = vi.fn((imageId: string) => {
    referenced.delete('current-image');
    referenced.add(imageId);
    return Promise.resolve();
  });

  beforeEach(() => {
    referenced.add('current-image');
    pointEntityAtNewImage.mockClear();
  });

  it('records both images, creates the new one under its own id, points the entity at it, then removes the current one and unrecords both', async () => {
    const { saveImage } = await import('../imageService');

    await saveImage('current-image', '/pick/map.png', pointEntityAtNewImage);

    expect(addPendingImageIds).toHaveBeenCalledWith([
      'new-image',
      'current-image',
    ]);
    expect(create).toHaveBeenCalledWith(
      { filePath: '/pick/map.png' },
      'new-image',
    );
    expect(pointEntityAtNewImage).toHaveBeenCalledWith('new-image');
    expect(remove.mock.calls).toEqual([['current-image']]);
    expect(unrecordedIds().sort()).toEqual(['current-image', 'new-image']);
    expect(addPendingImageIds.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0],
    );
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      pointEntityAtNewImage.mock.invocationCallOrder[0],
    );
    expect(pointEntityAtNewImage.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('records and removes only the new image’s entry when there is no current image', async () => {
    const { saveImage } = await import('../imageService');

    await saveImage(null, '/pick/map.png', pointEntityAtNewImage);

    expect(addPendingImageIds).toHaveBeenCalledWith(['new-image']);
    expect(remove).not.toHaveBeenCalled();
  });

  it('rejects with the entity write’s error, keeps the current image the entity still names and removes the new one, when the entity cannot be pointed at it', async () => {
    const { saveImage } = await import('../imageService');
    const updateError = new Error('locked');

    await expect(
      saveImage('current-image', '/pick/map.png', () =>
        Promise.reject(updateError),
      ),
    ).rejects.toBe(updateError);
    expect(remove.mock.calls).toEqual([['new-image']]);
    expect(unrecordedIds().sort()).toEqual(['current-image', 'new-image']);
  });

  it('rejects as ImageCreateError and points the entity at nothing when the creation fails', async () => {
    const { saveImage } = await import('../imageService');
    create.mockRejectedValue(new Error('disk'));

    await expect(
      saveImage('current-image', '/pick/map.png', pointEntityAtNewImage),
    ).rejects.toMatchObject({ name: 'ImageCreateError' });
    expect(pointEntityAtNewImage).not.toHaveBeenCalled();
  });

  it('rejects and writes nothing when the images cannot be recorded', async () => {
    const { saveImage } = await import('../imageService');
    addPendingImageIds.mockRejectedValue(new Error('locked'));

    await expect(
      saveImage('current-image', '/pick/map.png', pointEntityAtNewImage),
    ).rejects.toThrow(/^locked$/);
    expect(create).not.toHaveBeenCalled();
    expect(pointEntityAtNewImage).not.toHaveBeenCalled();
  });

  it('resolves, keeping the current image recorded for the next start, when it cannot be removed', async () => {
    const { saveImage } = await import('../imageService');
    remove.mockRejectedValue(new Error('file locked'));

    await expect(
      saveImage('current-image', '/pick/map.png', pointEntityAtNewImage),
    ).resolves.toBeUndefined();
    expect(unrecordedIds()).toEqual(['new-image']);
  });
});

describe('removeImage', () => {
  beforeEach(() => {
    referenced.add('old-image');
  });

  it('records the image, detaches it from the entity, then removes it and unrecords it', async () => {
    const { removeImage } = await import('../imageService');
    const detach = vi.fn(() => {
      referenced.delete('old-image');
      return Promise.resolve();
    });

    await removeImage('old-image', detach);

    expect(addPendingImageIds).toHaveBeenCalledWith(['old-image']);
    expect(remove).toHaveBeenCalledWith('old-image');
    expect(unrecordedIds()).toEqual(['old-image']);
    expect(addPendingImageIds.mock.invocationCallOrder[0]).toBeLessThan(
      detach.mock.invocationCallOrder[0],
    );
    expect(detach.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('rejects with the detach error and removes nothing the entity still names when it cannot be detached', async () => {
    const { removeImage } = await import('../imageService');
    const detachError = new Error('locked');

    await expect(
      removeImage('old-image', () => Promise.reject(detachError)),
    ).rejects.toBe(detachError);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('deleteWithImages', () => {
  it('records the images, deletes the entity, then removes each image, going on past one that fails and leaving that one recorded', async () => {
    const { deleteWithImages } = await import('../imageService');
    const deleteEntity = vi.fn(() => Promise.resolve());
    remove.mockRejectedValueOnce(new Error('file locked'));

    await expect(deleteWithImages(['a', 'b'], deleteEntity)).resolves.toBe(
      undefined,
    );

    expect(addPendingImageIds).toHaveBeenCalledWith(['a', 'b']);
    expect(remove.mock.calls).toEqual([['a'], ['b']]);
    expect(unrecordedIds()).toEqual(['b']);
    expect(addPendingImageIds.mock.invocationCallOrder[0]).toBeLessThan(
      deleteEntity.mock.invocationCallOrder[0],
    );
    expect(deleteEntity.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('rejects with the delete error and removes no image the entity still names when the entity cannot be deleted', async () => {
    const { deleteWithImages } = await import('../imageService');
    referenced.add('a');
    const deleteError = new Error('locked');

    await expect(
      deleteWithImages(['a'], () => Promise.reject(deleteError)),
    ).rejects.toBe(deleteError);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('duplicateWithImage', () => {
  it('records nothing and copies no image for a source without one', async () => {
    const { duplicateWithImage } = await import('../imageService');
    const duplicateEntity = vi.fn((_imageId: string | null) =>
      Promise.resolve('copy'),
    );

    await expect(duplicateWithImage(null, duplicateEntity)).resolves.toBe(
      'copy',
    );

    expect(duplicateEntity).toHaveBeenCalledWith(null);
    expect(addPendingImageIds).not.toHaveBeenCalled();
    expect(duplicate).not.toHaveBeenCalled();
  });

  it('records the copy, copies the source image under its id, hands that id to the entity copy and unrecords the copy the entity names', async () => {
    const { duplicateWithImage } = await import('../imageService');
    const duplicateEntity = vi.fn((imageId: string | null) => {
      if (imageId !== null) referenced.add(imageId);
      return Promise.resolve('copy');
    });

    await expect(
      duplicateWithImage('source-image', duplicateEntity),
    ).resolves.toBe('copy');

    expect(addPendingImageIds).toHaveBeenCalledWith(['new-image']);
    expect(duplicate).toHaveBeenCalledWith('source-image', 'new-image');
    expect(duplicateEntity).toHaveBeenCalledWith('new-image');
    expect(remove).not.toHaveBeenCalled();
    expect(unrecordedIds()).toEqual(['new-image']);
    expect(addPendingImageIds.mock.invocationCallOrder[0]).toBeLessThan(
      duplicate.mock.invocationCallOrder[0],
    );
  });

  it('removes the copy no entity names when the entity copy fails, rejecting with its error', async () => {
    const { duplicateWithImage } = await import('../imageService');
    const copyError = new Error('sections');

    await expect(
      duplicateWithImage('source-image', () => Promise.reject(copyError)),
    ).rejects.toBe(copyError);
    expect(remove).toHaveBeenCalledWith('new-image');
  });

  it('rejects as ImageDuplicateError, copying no entity, when the image cannot be copied', async () => {
    const { duplicateWithImage } = await import('../imageService');
    duplicate.mockRejectedValue(new Error('disk'));
    const duplicateEntity = vi.fn((_imageId: string | null) =>
      Promise.resolve('copy'),
    );

    await expect(
      duplicateWithImage('source-image', duplicateEntity),
    ).rejects.toMatchObject({ name: 'ImageDuplicateError' });
    expect(duplicateEntity).not.toHaveBeenCalled();
  });
});

describe('cleanUpAbandonedImages', () => {
  it('removes the recorded images no entity names, keeps the one an entity names, and unrecords all of them', async () => {
    const { cleanUpAbandonedImages } = await import('../imageService');
    getPendingImageIds.mockResolvedValue(['abandoned', 'named']);
    referenced.add('named');

    await cleanUpAbandonedImages();

    expect(remove.mock.calls).toEqual([['abandoned']]);
    expect(unrecordedIds()).toEqual(['abandoned', 'named']);
  });

  it('resolves when the record cannot be read', async () => {
    const { cleanUpAbandonedImages } = await import('../imageService');
    getPendingImageIds.mockRejectedValue(new Error('locked'));

    await expect(cleanUpAbandonedImages()).resolves.toBeUndefined();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('getImageById', () => {
  it('returns the image', async () => {
    const { getImageById } = await import('../imageService');
    const image = { id: 'found' } as Image;
    get.mockResolvedValue(image);

    await expect(getImageById('found')).resolves.toBe(image);
    expect(get).toHaveBeenCalledWith('found');
  });

  it('rejects as ImageNotFoundError when there is no such image', async () => {
    const { getImageById } = await import('../imageService');

    await expect(getImageById('missing')).rejects.toMatchObject({
      name: 'ImageNotFoundError',
    });
  });

  it('rejects as ImageLoadError, not as not found, when the load fails', async () => {
    const { getImageById } = await import('../imageService');
    get.mockRejectedValue(new Error('disk'));

    await expect(getImageById('any')).rejects.toMatchObject({
      name: 'ImageLoadError',
    });
  });
});

describe('getImageUrl', () => {
  it('asks the host for the file path of the id and extension and converts it to a displayable url', async () => {
    const { getImageUrl } = await import('../imageService');

    await expect(getImageUrl('image-a', 'png')).resolves.toBe(
      'asset:///store/images/a.png',
    );

    expect(invoke).toHaveBeenCalledWith('get_image_url', {
      id: 'image-a',
      extension: 'png',
    });
  });

  it('rejects as ImageUrlLoadError when the host fails', async () => {
    const { getImageUrl } = await import('../imageService');
    invoke.mockRejectedValue(new Error('missing'));

    await expect(getImageUrl('image-a', 'png')).rejects.toMatchObject({
      name: 'ImageUrlLoadError',
    });
  });
});

describe('updateImageFrame', () => {
  it('writes the frame position and zoom to the image row', async () => {
    const { updateImageFrame } = await import('../imageService');

    await updateImageFrame('image-a', { x: 0.25, y: 0.75, zoom: 2 });

    expect(update).toHaveBeenCalledWith('image-a', {
      frame_x: 0.25,
      frame_y: 0.75,
      frame_zoom: 2,
    });
  });

  it('rejects as ImageUpdateFrameError when the update fails', async () => {
    const { updateImageFrame } = await import('../imageService');
    update.mockRejectedValue(new Error('disk'));

    await expect(
      updateImageFrame('image-a', { x: 0, y: 0, zoom: 1 }),
    ).rejects.toMatchObject({ name: 'ImageUpdateFrameError' });
  });
});
