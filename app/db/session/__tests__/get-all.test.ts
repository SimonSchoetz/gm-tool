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

  it('should return all sessions ordered by created_at DESC', async () => {
    const mockSessions: Session[] = [
      {
        id: 2,
        title: 'Newer Session',
        created_at: '2025-10-13',
      },
      {
        id: 1,
        title: 'Older Session',
        created_at: '2025-10-12',
      },
    ];

    mockSelect.mockResolvedValue(mockSessions);

    const sessions = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions ORDER BY created_at DESC'
    );
    expect(sessions).toEqual(mockSessions);
  });

  it('should return empty array when no sessions exist', async () => {
    mockSelect.mockResolvedValue([]);

    const sessions = await getAll();

    expect(sessions).toEqual([]);
  });
});
