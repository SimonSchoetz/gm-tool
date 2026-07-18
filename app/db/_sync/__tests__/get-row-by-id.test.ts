import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

import { getRowById } from '../get-row-by-id';

describe('getRowById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should reject an unknown table name without querying', async () => {
    await expect(getRowById('not_a_table', 'id-1')).rejects.toThrow(
      'Unknown synced table: not_a_table',
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should select by id for a known table', async () => {
    mockSelect.mockResolvedValue([{ id: 'npc-1', name: 'Goblin' }]);

    const result = await getRowById('npcs', 'npc-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM npcs WHERE id = $1',
      ['npc-1'],
    );
    expect(result).toEqual({ id: 'npc-1', name: 'Goblin' });
  });

  it('should return null when the row is absent', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getRowById('npcs', 'missing');

    expect(result).toBeNull();
  });
});
