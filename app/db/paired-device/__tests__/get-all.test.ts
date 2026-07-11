import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PairedDevice } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { getAll } from '../get-all';

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return paired devices ordered by created_at DESC', async () => {
    const device1: PairedDevice = {
      id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      name: 'Laptop',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const device2: PairedDevice = {
      id: 'b1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      name: 'Desktop',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([device1, device2]);

    const result = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM paired_devices ORDER BY created_at DESC',
    );
    expect(result).toEqual([device1, device2]);
  });

  it('should return empty array when no paired devices exist', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll();

    expect(result).toEqual([]);
  });
});
