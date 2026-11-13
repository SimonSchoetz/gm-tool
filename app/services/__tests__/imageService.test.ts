import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as imageDb from '@db/image';
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
const invoke = vi.hoisted(() => vi.fn<typeof invokeType>());
const convertFileSrc = vi.hoisted(() => vi.fn<typeof convertType>());

vi.mock('@db/image', () => ({
  get,
  create,
  remove,
  duplicate,
  update,
}));
vi.mock('@platform', () => ({ invoke, convertFileSrc }));

beforeEach(() => {
  vi.resetModules();
  get.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue('created-image');
  remove.mockReset().mockResolvedValue();
  duplicate.mockReset().mockResolvedValue('copied-image');
  update.mockReset().mockResolvedValue();
  invoke.mockReset().mockResolvedValue('/store/images/a.png');
  convertFileSrc.mockReset().mockImplementation((path) => `asset://${path}`);
});

describe('saveImage', () => {
  it('creates the new image, points the entity at it, then removes the current image, in that order', async () => {
    const { saveImage } = await import('../imageService');
    const pointEntityAt = vi.fn((_imageId: string) => Promise.resolve());

    await saveImage('current-image', '/pick/map.png', pointEntityAt);

    expect(create).toHaveBeenCalledWith({ filePath: '/pick/map.png' });
    expect(pointEntityAt).toHaveBeenCalledWith('created-image');
    expect(remove).toHaveBeenCalledWith('current-image');
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      pointEntityAt.mock.invocationCallOrder[0],
    );
    expect(pointEntityAt.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('removes nothing when there is no current image', async () => {
    const { saveImage } = await import('../imageService');

    await saveImage(null, '/pick/map.png', () => Promise.resolve());

    expect(remove).not.toHaveBeenCalled();
  });

  it('resolves when the current image cannot be removed after the entity points at the new one', async () => {
    const { saveImage } = await import('../imageService');
    remove.mockRejectedValue(new Error('file locked'));

    await expect(
      saveImage('current-image', '/pick/map.png', () => Promise.resolve()),
    ).resolves.toBeUndefined();
  });

  it('rejects with the entity update’s error and keeps the current image when the entity cannot be pointed at the new one', async () => {
    const { saveImage } = await import('../imageService');
    const updateError = new Error('locked');

    await expect(
      saveImage('current-image', '/pick/map.png', () =>
        Promise.reject(updateError),
      ),
    ).rejects.toBe(updateError);
    expect(remove).not.toHaveBeenCalled();
  });

  it('rejects as ImageCreateError, pointing the entity at nothing, when the creation fails', async () => {
    const { saveImage } = await import('../imageService');
    create.mockRejectedValue(new Error('disk'));
    const pointEntityAt = vi.fn((_imageId: string) => Promise.resolve());

    await expect(
      saveImage(null, '/pick/map.png', pointEntityAt),
    ).rejects.toMatchObject({ name: 'ImageCreateError' });
    expect(pointEntityAt).not.toHaveBeenCalled();
  });
});

describe('removeImage', () => {
  it('detaches the image from the entity, then removes it', async () => {
    const { removeImage } = await import('../imageService');
    const detach = vi.fn(() => Promise.resolve());

    await removeImage('old-image', detach);

    expect(remove).toHaveBeenCalledWith('old-image');
    expect(detach.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0],
    );
  });

  it('rejects with the detach error and removes nothing when the entity cannot be detached', async () => {
    const { removeImage } = await import('../imageService');
    const detachError = new Error('locked');

    await expect(
      removeImage('old-image', () => Promise.reject(detachError)),
    ).rejects.toBe(detachError);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('duplicateImage', () => {
  it('resolves the id of the copy of the source', async () => {
    const { duplicateImage } = await import('../imageService');

    await expect(duplicateImage('source-image')).resolves.toBe('copied-image');
    expect(duplicate).toHaveBeenCalledWith('source-image');
  });

  it('rejects as ImageDuplicateError when the copy fails', async () => {
    const { duplicateImage } = await import('../imageService');
    duplicate.mockRejectedValue(new Error('disk'));

    await expect(duplicateImage('source-image')).rejects.toMatchObject({
      name: 'ImageDuplicateError',
    });
  });
});

describe('discardImages', () => {
  it('removes every image, and goes on to the next when one cannot be removed, resolving', async () => {
    const { discardImages } = await import('../imageService');
    remove.mockRejectedValueOnce(new Error('file locked'));

    await expect(discardImages(['a', 'b'])).resolves.toBeUndefined();

    expect(remove.mock.calls).toEqual([['a'], ['b']]);
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
