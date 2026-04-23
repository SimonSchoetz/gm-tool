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

import { get } from '../get';

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return NPC by id', async () => {
    const mockNpc: Npc = {
      id: 'test-id',
      adventure_id: 'test-adventure-id',
      name: 'Test NPC',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([mockNpc]);

    const result = await get('test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM npcs WHERE id = $1',
      ['test-id'],
    );
    expect(result).toEqual(mockNpc);
  });

  it('should return null when NPC not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });
});
