import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PairedDevice } from '../types';

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

import { get } from '../get';

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return paired device by id', async () => {
    const mockDevice: PairedDevice = {
      id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      name: 'Laptop',
      created_at: '2025-10-13',
      updated_at: '2025-10-13',
    };

    mockSelect.mockResolvedValue([mockDevice]);

    const result = await get(mockDevice.id);

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM paired_devices WHERE id = $1',
      [mockDevice.id],
    );
    expect(result).toEqual(mockDevice);
  });

  it('should return null when paired device not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw error when id is empty', async () => {
    await expect(get('')).rejects.toThrow('Valid paired device ID is required');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should throw error when id is whitespace only', async () => {
    await expect(get('   ')).rejects.toThrow(
      'Valid paired device ID is required',
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
