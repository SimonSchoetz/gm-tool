import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as imageDb from '@db/image';

const create = vi.hoisted(() => vi.fn<typeof imageDb.create>());
const replace = vi.hoisted(() => vi.fn<typeof imageDb.replace>());

vi.mock('@db/image', () => ({ create, replace }));

describe('saveImage', () => {
  beforeEach(() => {
    vi.resetModules();
    create.mockReset().mockResolvedValue('created-image');
    replace.mockReset().mockResolvedValue('replacement-image');
  });

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
});
