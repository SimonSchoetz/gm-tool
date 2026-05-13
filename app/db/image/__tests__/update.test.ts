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

    expect(mockExecute).toHaveBeenCalledOnce();
    const sql: string = mockExecute.mock.calls[0][0] as string;
    expect(sql).toContain('frame_x');
    expect(sql).toContain('frame_y');
    expect(sql).toContain('frame_zoom');
    expect(sql).toContain('updated_at');
  });

  it('throws when id is empty', async () => {
    await expect(
      update('', { frame_x: 50, frame_y: 25, frame_zoom: 1.0 })
    ).rejects.toThrow('Valid image ID is required');
  });

  it('sets null frame values', async () => {
    await update('test-id', { frame_x: null, frame_y: null, frame_zoom: null });

    expect(mockExecute).toHaveBeenCalledOnce();
  });
});
