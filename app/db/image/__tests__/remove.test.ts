import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      })
    ),
  },
}));

import { remove } from '../remove';

describe('image.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should delete image by id', async () => {
    await remove('test-id-1');

    expect(mockExecute).toHaveBeenCalledWith('DELETE FROM images WHERE id = $1', [
      'test-id-1',
    ]);
  });

  it('should throw error when id is empty', async () => {
    await expect(remove('')).rejects.toThrow('Image ID is required');
  });

  it('should not throw error when deleting non-existent image', async () => {
    mockExecute.mockResolvedValue({ lastInsertId: 0 });

    await expect(remove('non-existent-id')).resolves.not.toThrow();
  });
});
