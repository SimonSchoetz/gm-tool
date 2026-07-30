import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
    ),
  },
}));

vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'new-image-id'),
  };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockGet = vi.fn();
vi.mock('../get', () => ({
  get: (id: string) => mockGet(id) as unknown,
}));

import { duplicate } from '../duplicate';

const sourceRow = {
  id: 'source-image-id',
  file_extension: 'png',
  original_filename: 'portrait.png',
  file_size: 2048,
  frame_x: 12.5,
  frame_y: -30,
  frame_zoom: 1.75,
  created_at: '2023-05-01T08:00:00.000Z',
  updated_at: '2023-05-02T08:00:00.000Z',
};

const INSERT_SQL =
  'INSERT INTO images (id, file_extension, original_filename, file_size, frame_x, frame_y, frame_zoom, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';

describe('image.duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
    mockGet.mockResolvedValue(sourceRow);
    vi.mocked(invoke).mockResolvedValue('base64-bytes');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("copies the source row's framing values into the new row", async () => {
    await duplicate('source-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-image-id',
      'png',
      'portrait.png',
      2048,
      12.5,
      -30,
      1.75,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('takes file_size from the source row, not from the save command', async () => {
    vi.mocked(invoke).mockImplementation((command: string) =>
      command === 'read_image_bytes'
        ? Promise.resolve('base64-bytes')
        : Promise.resolve(undefined),
    );

    await duplicate('source-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-image-id',
      'png',
      'portrait.png',
      2048,
      12.5,
      -30,
      1.75,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it("reads and writes the file with the source's extension", async () => {
    await duplicate('source-image-id');

    expect(invoke).toHaveBeenCalledWith('read_image_bytes', {
      id: 'source-image-id',
      extension: 'png',
    });
    expect(invoke).toHaveBeenCalledWith('save_image_bytes', {
      id: 'new-image-id',
      extension: 'png',
      dataBase64: 'base64-bytes',
    });
  });

  it("generates fresh timestamps rather than copying the source's", async () => {
    await duplicate('source-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-image-id',
      'png',
      'portrait.png',
      2048,
      12.5,
      -30,
      1.75,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
    expect(mockExecute).not.toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['2023-05-01T08:00:00.000Z']),
    );
  });

  it('throws when the source image does not exist', async () => {
    mockGet.mockResolvedValue(null);

    await expect(duplicate('missing-image-id')).rejects.toThrow(
      'Image not found: missing-image-id',
    );
  });
});
