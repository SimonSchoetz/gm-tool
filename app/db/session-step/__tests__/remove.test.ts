import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
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

  it('should delete session step by id', async () => {
    await remove('step-id');

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM session_steps WHERE id = $1',
      ['step-id'],
    );
  });

  it('should throw when id is empty', async () => {
    await expect(remove('')).rejects.toThrow(
      'Valid Session Step ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when id is whitespace only', async () => {
    await expect(remove('   ')).rejects.toThrow(
      'Valid Session Step ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
