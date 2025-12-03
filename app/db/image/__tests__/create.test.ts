import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreateImageInput } from '../types';

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

vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'test-generated-id'),
  };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve(1024)),
}));

import { create } from '../create';

describe('image.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should create image with all fields', async () => {
    const input: CreateImageInput = {
      filePath: '/path/to/my-photo.jpg',
    };

    const result = await create(input);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
      [expect.any(String), 'jpg', 'my-photo.jpg', 1024]
    );

    expect(typeof result).toBe('string');
    expect(result).toBeTruthy();
  });

  it('should create image with only required fields', async () => {
    const input: CreateImageInput = {
      filePath: '/path/to/image.png',
    };

    const result = await create(input);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
      [expect.any(String), 'png', 'image.png', 1024]
    );

    expect(typeof result).toBe('string');
    expect(result).toBeTruthy();
  });

  it('should accept all valid file extensions', async () => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;

    for (const ext of validExtensions) {
      vi.clearAllMocks();
      mockExecute.mockResolvedValue({ lastInsertId: 0 });
      mockSelect.mockResolvedValue([]);

      const input: CreateImageInput = {
        filePath: `/path/to/image.${ext}`,
      };

      const result = await create(input);

      expect(mockExecute).toHaveBeenCalledWith(
        'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
        [expect.any(String), ext, `image.${ext}`, 1024]
      );
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    }
  });

  it('should throw validation error for invalid file extension', async () => {
    const input: CreateImageInput = {
      filePath: '/path/to/document.pdf',
    };

    await expect(create(input)).rejects.toThrow('Unsupported file extension');
  });

  it('should throw validation error for missing file_extension', async () => {
    const input = {
      filePath: '/path/to/file',
    };

    await expect(create(input as any)).rejects.toThrow('Unsupported file extension');
  });
});
