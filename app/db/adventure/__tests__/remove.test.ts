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

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should delete adventure by id', async () => {
    await remove('test-id');

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM adventures WHERE id = $1',
      ['test-id']
    );
  });

  it('should throw error when id is empty', async () => {
    await expect(remove('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
