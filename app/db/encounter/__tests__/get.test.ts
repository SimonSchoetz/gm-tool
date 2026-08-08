import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Encounter } from '../types';

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

  it('should return Encounter by id', async () => {
    const mockEncounter: Encounter = {
      id: 'test-id',
      adventure_id: 'test-adventure-id',
      name: 'Test Encounter',
      description: null,
      pinned_order: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([mockEncounter]);

    const result = await get('test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM encounters WHERE id = $1',
      ['test-id'],
    );
    expect(result).toEqual(mockEncounter);
  });

  it('should return null when Encounter not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw when id is empty string', async () => {
    await expect(get('')).rejects.toThrow('Valid Encounter ID is required');
  });

  it('should throw when id is whitespace only', async () => {
    await expect(get('   ')).rejects.toThrow('Valid Encounter ID is required');
  });
});
