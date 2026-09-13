import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BaseEntity } from '../types';

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

  it('should return rows for a given adventure and entity type ordered by created_at DESC', async () => {
    const row1: BaseEntity = {
      id: '1',
      adventure_id: 'adv-1',
      entity_type: 'npcs',
      name: 'NPC 1',
      summary: null,
      description: null,
      image_id: null,
      pinned_order: null,
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const row2: BaseEntity = {
      id: '2',
      adventure_id: 'adv-1',
      entity_type: 'npcs',
      name: 'NPC 2',
      summary: null,
      description: null,
      image_id: null,
      pinned_order: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([row1, row2]);

    const result = await getAll('npcs', 'adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM base_entities WHERE adventure_id = $1 AND entity_type = $2 ORDER BY created_at DESC',
      ['adv-1', 'npcs'],
    );
    expect(result).toEqual([row1, row2]);
  });

  it('should return empty array when no rows exist', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll('npcs', 'adv-1');

    expect(result).toEqual([]);
  });

  it('should throw when adventureId is empty string', async () => {
    await expect(getAll('npcs', '')).rejects.toThrow(
      'Valid Adventure ID is required',
    );
  });

  it('should throw when adventureId is whitespace only', async () => {
    await expect(getAll('npcs', '   ')).rejects.toThrow(
      'Valid Adventure ID is required',
    );
  });
});
