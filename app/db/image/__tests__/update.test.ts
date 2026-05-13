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

import { update } from '../update';

describe('image.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('updates frame successfully', async () => {
    await update('test-id', { frame_x: 50, frame_y: 25, frame_zoom: 2.0 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringMatching(/frame_x.*frame_y.*frame_zoom.*updated_at/s),
      expect.arrayContaining([50, 25, 2.0, 'test-id']),
    );
  });

  it('throws when id is empty', async () => {
    await expect(
      update('', { frame_x: 50, frame_y: 25, frame_zoom: 1.0 })
    ).rejects.toThrow('Valid image ID is required');
  });

  it('sets null frame values', async () => {
    await update('test-id', { frame_x: null, frame_y: null, frame_zoom: null });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE images'),
      expect.arrayContaining(['test-id']),
    );
  });
});
