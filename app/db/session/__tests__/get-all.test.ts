import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

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

import { getAll } from '../get-all';

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return sessions for the given adventure, ordered by created_at DESC', async () => {
    const mockSessions: Session[] = [
      {
        id: 'id-2',
        adventure_id: 'adv-1',
        active_view: 'prep',
        name: 'Newer Session',
        created_at: '2025-10-13',
      },
      {
        id: 'id-1',
        adventure_id: 'adv-1',
        active_view: 'prep',
        name: 'Older Session',
        created_at: '2025-10-12',
      },
    ];

    mockSelect.mockResolvedValue(mockSessions);

    const result = await getAll('adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions WHERE adventure_id = $1 ORDER BY created_at DESC',
      ['adv-1'],
    );
    expect(result).toEqual(mockSessions);
  });

  it('should return empty array when no sessions exist for the adventure', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll('adv-empty');

    expect(result).toEqual([]);
  });
});
