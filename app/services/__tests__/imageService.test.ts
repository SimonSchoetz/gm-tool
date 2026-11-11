import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as imageDb from '@db/image';
import type { Image } from '@db/image';
import type {
  invoke as invokeType,
  convertFileSrc as convertType,
} from '@platform';

const get = vi.hoisted(() => vi.fn<typeof imageDb.get>());
const create = vi.hoisted(() => vi.fn<typeof imageDb.create>());
const replace = vi.hoisted(() => vi.fn<typeof imageDb.replace>());
const remove = vi.hoisted(() => vi.fn<typeof imageDb.remove>());
const duplicate = vi.hoisted(() => vi.fn<typeof imageDb.duplicate>());
const update = vi.hoisted(() => vi.fn<typeof imageDb.update>());
const invoke = vi.hoisted(() => vi.fn<typeof invokeType>());
const convertFileSrc = vi.hoisted(() => vi.fn<typeof convertType>());

vi.mock('@db/image', () => ({
  get,
  create,
  replace,
  remove,
  duplicate,
  update,
}));
vi.mock('@platform', () => ({ invoke, convertFileSrc }));

beforeEach(() => {
  vi.resetModules();
  get.mockReset().mockResolvedValue(null);
  create.mockReset().mockResolvedValue('created-image');
  replace.mockReset().mockResolvedValue('replacement-image');
  remove.mockReset().mockResolvedValue();
  duplicate.mockReset().mockResolvedValue('copied-image');
  update.mockReset().mockResolvedValue();
  invoke.mockReset().mockResolvedValue('/store/images/a.png');
  convertFileSrc.mockReset().mockImplementation((path) => `asset://${path}`);
});

describe('saveImage', () => {
  it('replaces the current image with the file and resolves the replacement id, creating nothing', async () => {
    const { saveImage } = await import('../imageService');

    await expect(saveImage('current-image', '/pick/map.png')).resolves.toBe(
      'replacement-image',
    );

    expect(replace).toHaveBeenCalledWith('current-image', {
      filePath: '/pick/map.png',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates an image from the file and resolves its id when there is no current image, replacing nothing', async () => {
    const { saveImage } = await import('../imageService');

    await expect(saveImage(null, '/pick/map.png')).resolves.toBe(
      'created-image',
    );

    expect(create).toHaveBeenCalledWith({ filePath: '/pick/map.png' });
    expect(replace).not.toHaveBeenCalled();
  });

  it('rejects as ImageReplaceError when the replacement fails', async () => {
    const { saveImage } = await import('../imageService');
    replace.mockRejectedValue(new Error('disk'));

    await expect(
      saveImage('current-image', '/pick/map.png'),
    ).rejects.toMatchObject({ name: 'ImageReplaceError' });
  });

  it('rejects as ImageCreateError when the creation fails', async () => {
    const { saveImage } = await import('../imageService');
    create.mockRejectedValue(new Error('disk'));

    await expect(saveImage(null, '/pick/map.png')).rejects.toMatchObject({
      name: 'ImageCreateError',
    });
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

describe('deleteImage', () => {
  it('removes the image', async () => {
    const { deleteImage } = await import('../imageService');

    await deleteImage('doomed-image');

    expect(remove).toHaveBeenCalledWith('doomed-image');
  });

  it('rejects as ImageDeleteError when the removal fails', async () => {
    const { deleteImage } = await import('../imageService');
    remove.mockRejectedValue(new Error('disk'));

    await expect(deleteImage('doomed-image')).rejects.toMatchObject({
      name: 'ImageDeleteError',
    });
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
