import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

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

import { getAll } from '../get-all';

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return paginated sessions with default limit', async () => {
    const mockSessions: Session[] = [
      {
        id: 'id-2',
        title: 'Newer Session',
        created_at: '2025-10-13',
      },
      {
        id: 'id-1',
        title: 'Older Session',
        created_at: '2025-10-12',
      },
    ];

    mockSelect
      .mockResolvedValueOnce([]) // Migration check
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce(mockSessions);

    const result = await getAll();

    expect(mockSelect).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM sessions');
    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [20, 0]
    );
    expect(result).toEqual({
      data: mockSessions,
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  it('should return paginated sessions with custom limit and offset', async () => {
    const mockSessions: Session[] = [
      {
        id: 'id-3',
        title: 'Session 3',
        created_at: '2025-10-13',
      },
    ];

    mockSelect
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce(mockSessions);

    const result = await getAll({ limit: 10, offset: 20 });

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [10, 20]
    );
    expect(result).toEqual({
      data: mockSessions,
      total: 50,
      limit: 10,
      offset: 20,
      hasMore: true,
    });
  });

  it('should enforce maximum limit', async () => {
    mockSelect
      .mockResolvedValueOnce([{ count: 200 }])
      .mockResolvedValueOnce([]);

    await getAll({ limit: 200 });

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [100, 0]
    );
  });

  it('should return empty data array when no sessions exist', async () => {
    mockSelect
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([]);

    const result = await getAll();

    expect(result).toEqual({
      data: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  it('should throw error when limit is less than 1', async () => {
    // No need to mock since validation happens before database call
    await expect(getAll({ limit: 0 })).rejects.toThrow('Limit must be at least 1');
    await expect(getAll({ limit: -5 })).rejects.toThrow('Limit must be at least 1');

    // Verify database was never called
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should throw error when offset is negative', async () => {
    await expect(getAll({ offset: -1 })).rejects.toThrow('Offset cannot be negative');
    await expect(getAll({ offset: -10 })).rejects.toThrow('Offset cannot be negative');
  });

  it('should calculate hasMore correctly when on last page', async () => {
    const mockSessions: Session[] = [
      {
        id: 'id-1',
        title: 'Last Session',
        created_at: '2025-10-13',
      },
    ];

    mockSelect
      .mockResolvedValueOnce([{ count: 21 }])
      .mockResolvedValueOnce(mockSessions);

    const result = await getAll({ limit: 20, offset: 20 });

    expect(result.hasMore).toBe(false);
    expect(result.offset + result.data.length).toBe(21);
  });
});
