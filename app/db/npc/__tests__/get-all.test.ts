import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Npc } from '../types';

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
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return NPCs for a given adventureId ordered by created_at DESC', async () => {
    const npc1: Npc = {
      id: '1',
      adventure_id: 'adv-1',
      name: 'NPC 1',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const npc2: Npc = {
      id: '2',
      adventure_id: 'adv-1',
      name: 'NPC 2',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([npc1, npc2]);

    const result = await getAll('adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM npcs WHERE adventure_id = $1 ORDER BY created_at DESC',
      ['adv-1'],
    );
    expect(result).toEqual([npc1, npc2]);
  });

  it('should return empty array when no NPCs exist for the adventure', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll('adv-1');

    expect(result).toEqual([]);
  });

  it('should throw when adventureId is empty string', async () => {
    await expect(getAll('')).rejects.toThrow('Valid Adventure ID is required');
  });

  it('should throw when adventureId is whitespace only', async () => {
    await expect(getAll('   ')).rejects.toThrow(
      'Valid Adventure ID is required',
    );
  });
});
