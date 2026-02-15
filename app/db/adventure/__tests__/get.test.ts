import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Adventure } from '../types';

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

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return adventure by id', async () => {
    const mockAdventure: Adventure = {
      id: 'test-id',
      name: 'Test Adventure',
      description: 'Test Description',
      created_at: '2025-10-13',
      updated_at: '2025-10-13',
    };

    mockSelect.mockResolvedValue([mockAdventure]);

    const result = await get('test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM adventures WHERE id = $1',
      ['test-id']
    );
    expect(result).toEqual(mockAdventure);
  });

  it('should return null when adventure not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw error when id is empty', async () => {
    await expect(get('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
