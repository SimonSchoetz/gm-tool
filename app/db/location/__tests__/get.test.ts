import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Location } from '../types';

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
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return Location by id', async () => {
    const mockLocation: Location = {
      id: 'test-id',
      adventure_id: 'test-adventure-id',
      name: 'Test Location',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([mockLocation]);

    const result = await get('test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM locations WHERE id = $1',
      ['test-id'],
    );
    expect(result).toEqual(mockLocation);
  });

  it('should return null when Location not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw when id is empty string', async () => {
    await expect(get('')).rejects.toThrow('Valid Location ID is required');
  });

  it('should throw when id is whitespace only', async () => {
    await expect(get('   ')).rejects.toThrow('Valid Location ID is required');
  });
});
