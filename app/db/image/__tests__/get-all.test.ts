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

import { getAll } from '../get-all';

describe('image.getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return all images', async () => {
    const mockImages: Image[] = [
      {
        id: 'image-1',
        file_extension: 'jpg',
        original_filename: 'photo1.jpg',
        file_size: 1024,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'image-2',
        file_extension: 'png',
        original_filename: 'photo2.png',
        file_size: 2048,
        created_at: '2025-01-02T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z',
      },
    ];

    mockSelect.mockResolvedValue(mockImages);

    const images = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM images ORDER BY created_at DESC'
    );
    expect(images).toEqual(mockImages);
    expect(images).toHaveLength(2);
  });

  it('should return empty array when no images exist', async () => {
    mockSelect.mockResolvedValue([]);

    const images = await getAll();

    expect(images).toEqual([]);
    expect(images).toHaveLength(0);
  });

  it('should handle images with various file extensions', async () => {
    const mockImages: Image[] = [
      {
        id: 'img-jpg',
        file_extension: 'jpg',
        original_filename: null,
        file_size: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'img-png',
        file_extension: 'png',
        original_filename: null,
        file_size: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'img-webp',
        file_extension: 'webp',
        original_filename: null,
        file_size: null,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      },
    ];

    mockSelect.mockResolvedValue(mockImages);

    const images = await getAll();

    expect(images).toHaveLength(3);
    expect(images.map((img) => img.file_extension)).toEqual([
      'jpg',
      'png',
      'webp',
    ]);
  });
});
