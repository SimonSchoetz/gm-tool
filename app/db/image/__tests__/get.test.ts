import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Image } from '../types';

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

import { get } from '../get';

describe('image.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return image by id', async () => {
    const mockImage: Image = {
      id: 'test-id-1',
      file_extension: 'jpg',
      original_filename: 'photo.jpg',
      file_size: 2048,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    };

    mockSelect.mockResolvedValue([mockImage]);

    const image = await get('test-id-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM images WHERE id = $1',
      ['test-id-1']
    );
    expect(image).toEqual(mockImage);
  });

  it('should return null when image not found', async () => {
    mockSelect.mockResolvedValue([]);

    const image = await get('non-existent-id');

    expect(image).toBeNull();
  });

  it('should throw error when id is empty', async () => {
    await expect(get('')).rejects.toThrow('Image ID is required');
  });

  it('should handle image with null optional fields', async () => {
    const mockImage: Image = {
      id: 'test-id-2',
      file_extension: 'png',
      original_filename: null,
      file_size: null,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    };

    mockSelect.mockResolvedValue([mockImage]);

    const image = await get('test-id-2');

    expect(image).toEqual(mockImage);
    expect(image?.original_filename).toBeNull();
    expect(image?.file_size).toBeNull();
  });
});
