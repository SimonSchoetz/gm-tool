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

import { get } from '../get';

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return base entity by id scoped to entity type', async () => {
    const mockRow: BaseEntity = {
      id: 'test-id',
      adventure_id: 'test-adventure-id',
      entity_type: 'npcs',
      name: 'Test NPC',
      summary: null,
      description: null,
      image_id: null,
      pinned_order: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([mockRow]);

    const result = await get('npcs', 'test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM base_entities WHERE id = $1 AND entity_type = $2',
      ['test-id', 'npcs'],
    );
    expect(result).toEqual(mockRow);
  });

  it('should return null when no row matches', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('npcs', 'non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw when id is empty string', async () => {
    await expect(get('npcs', '')).rejects.toThrow(
      'Valid Base entity ID is required',
    );
  });

  it('should throw when id is whitespace only', async () => {
    await expect(get('npcs', '   ')).rejects.toThrow(
      'Valid Base entity ID is required',
    );
  });
});
