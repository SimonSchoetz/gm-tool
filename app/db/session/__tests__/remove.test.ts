import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({
      execute: mockExecute,
      select: mockSelect,
    })),
  },
}));

import { remove } from '../remove';

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should delete session by id', async () => {
    mockExecute.mockResolvedValue({});

    await remove(1);

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM sessions WHERE id = $1',
      [1]
    );
  });

  it('should throw error when id is invalid', async () => {
    await expect(remove(0)).rejects.toThrow('Valid session ID is required');
    await expect(remove(-1)).rejects.toThrow('Valid session ID is required');
  });
});
