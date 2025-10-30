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

import { getAll } from '../get-all';

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return paginated adventures with default limit', async () => {
    const mockAdventures: Adventure[] = [
      {
        id: '1',
        title: 'Adventure 1',
        created_at: '2025-10-13',
        updated_at: '2025-10-13',
      },
    ];

    mockSelect
      .mockResolvedValueOnce([{ count: 15 }])
      .mockResolvedValueOnce(mockAdventures);

    const result = await getAll();

    expect(result).toEqual({
      data: mockAdventures,
      total: 15,
      limit: 10,
      offset: 0,
      hasMore: true,
    });
  });

  it('should throw error when limit is too large', async () => {
    await expect(getAll({ limit: 101 })).rejects.toThrow(
      'Limit must be between 1 and 100'
    );
  });

  it('should throw error when offset is negative', async () => {
    await expect(getAll({ offset: -1 })).rejects.toThrow(
      'Offset must be non-negative'
    );
  });
});
