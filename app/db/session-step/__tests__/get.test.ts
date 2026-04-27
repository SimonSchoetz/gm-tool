import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionStep } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { get } from '../get';

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return session step by id', async () => {
    const mockStep: SessionStep = {
      id: 'step-id',
      session_id: 'sess-1',
      sort_order: 0,
      checked: 0,
    };

    mockSelect.mockResolvedValue([mockStep]);

    const result = await get('step-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM session_steps WHERE id = $1',
      ['step-id'],
    );
    expect(result).toEqual(mockStep);
  });

  it('should return null when session step not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw when id is empty string', async () => {
    await expect(get('')).rejects.toThrow('Valid SessionStep ID is required');
  });

  it('should throw when id is whitespace only', async () => {
    await expect(get('   ')).rejects.toThrow(
      'Valid SessionStep ID is required',
    );
  });
});
