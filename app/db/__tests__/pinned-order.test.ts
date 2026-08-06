import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { getMaxPinnedOrder, setPinnedOrder } from '../pinned-order';

describe('getMaxPinnedOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('scopes the maximum to the adventure of the given row', async () => {
    mockSelect.mockResolvedValue([{ max_order: 4 }]);

    const result = await getMaxPinnedOrder('npcs', 'npc-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT MAX(pinned_order) as max_order FROM npcs WHERE pinned_order IS NOT NULL AND adventure_id = (SELECT adventure_id FROM npcs WHERE id = $1)',
      ['npc-1'],
    );
    expect(result).toBe(4);
  });

  it('returns null when no row is pinned', async () => {
    mockSelect.mockResolvedValue([{ max_order: null }]);

    const result = await getMaxPinnedOrder('npcs', 'npc-1');

    expect(result).toBeNull();
  });
});

describe('setPinnedOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('writes the given number to the identified row', async () => {
    await setPinnedOrder('npcs', 'npc-1', 3);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE npcs SET pinned_order = $1 WHERE id = $2',
      [3, 'npc-1'],
    );
  });

  it('writes null when unpinning', async () => {
    await setPinnedOrder('npcs', 'npc-1', null);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE npcs SET pinned_order = $1 WHERE id = $2',
      [null, 'npc-1'],
    );
  });
});
