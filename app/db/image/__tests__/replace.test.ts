import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../remove', () => ({ remove: vi.fn() }));
vi.mock('../create', () => ({ create: vi.fn() }));

import { replace } from '../replace';
import { remove as mockRemove } from '../remove';
import { create as mockCreate } from '../create';

describe('replace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRemove).mockResolvedValue(undefined);
    vi.mocked(mockCreate).mockResolvedValue('new-image-id');
  });

  it('should call remove with the old id, then create with the given data, and return the new id', async () => {
    const result = await replace('old-id', { filePath: '/path/to/image.jpg' });

    expect(mockRemove).toHaveBeenCalledWith('old-id');
    expect(mockCreate).toHaveBeenCalledWith({ filePath: '/path/to/image.jpg' });
    expect(result).toBe('new-image-id');
  });

  it('should propagate error if remove throws', async () => {
    vi.mocked(mockRemove).mockRejectedValue(new Error('remove failed'));

    await expect(
      replace('old-id', { filePath: '/path/to/image.jpg' }),
    ).rejects.toThrow('remove failed');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should propagate error if create throws', async () => {
    vi.mocked(mockCreate).mockRejectedValue(new Error('create failed'));

    await expect(
      replace('old-id', { filePath: '/path/to/image.jpg' }),
    ).rejects.toThrow('create failed');
  });
});
