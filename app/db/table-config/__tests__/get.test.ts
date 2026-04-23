import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { TableLayout } from '../layout-schema';

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

const validLayout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 200 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return parsed TableConfig when found', async () => {
    const fixtureRow = {
      id: 'test-id',
      table_name: 'npcs',
      color: '#3498db',
      tagging_enabled: 1,
      scope: 'adventure',
      layout: JSON.stringify(validLayout),
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([fixtureRow]);

    const result = await get('test-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM table_config WHERE id = $1',
      ['test-id'],
    );
    expect(result?.layout).toEqual(validLayout);
    expect(result?.id).toBe('test-id');
  });

  it('should return null when not found', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await get('non-existent-id');

    expect(result).toBeNull();
  });

  it('should throw when id is empty', async () => {
    await expect(get('')).rejects.toThrow('Valid table config ID is required');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should throw when id is whitespace only', async () => {
    await expect(get('   ')).rejects.toThrow(
      'Valid table config ID is required',
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
