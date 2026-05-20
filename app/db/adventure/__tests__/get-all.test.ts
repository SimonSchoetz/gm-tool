import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Adventure } from '../types';

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

  it('should return adventures ordered by created_at DESC', async () => {
    const adventure1: Adventure = {
      id: '1',
      name: 'Adventure 1',
      description: 'Desc 1',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const adventure2: Adventure = {
      id: '2',
      name: 'Adventure 2',
      description: 'Desc 2',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([adventure1, adventure2]);

    const result = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM adventures ORDER BY created_at DESC',
    );
    expect(result).toEqual([adventure1, adventure2]);
  });

  it('should return empty array when no adventures exist', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll();

    expect(result).toEqual([]);
  });
});
