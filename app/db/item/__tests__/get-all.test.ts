import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Item } from '../types';

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

  it('should return items for a given adventureId ordered by created_at DESC', async () => {
    const item1: Item = {
      id: '1',
      adventure_id: 'adv-1',
      name: 'Item 1',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
    };
    const item2: Item = {
      id: '2',
      adventure_id: 'adv-1',
      name: 'Item 2',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([item1, item2]);

    const result = await getAll('adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM items WHERE adventure_id = $1 ORDER BY created_at DESC',
      ['adv-1'],
    );
    expect(result).toEqual([item1, item2]);
  });

  it('should return empty array when no items exist for the adventure', async () => {
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
