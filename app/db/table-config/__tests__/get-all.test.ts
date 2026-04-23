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

import { getAll } from '../get-all';

const validLayout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 200 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return all table configs with parsed layouts ordered by table_name ASC', async () => {
    const row1 = {
      id: '1',
      table_name: 'npcs',
      color: '#3498db',
      tagging_enabled: 1,
      scope: 'adventure',
      layout: JSON.stringify(validLayout),
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };
    const row2 = {
      id: '2',
      table_name: 'sessions',
      color: '#e74c3c',
      tagging_enabled: 1,
      scope: 'adventure',
      layout: JSON.stringify(validLayout),
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    mockSelect.mockResolvedValue([row1, row2]);

    const result = await getAll();

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM table_config ORDER BY table_name ASC',
    );
    expect(result).toHaveLength(2);
    expect(result[0].layout).toEqual(validLayout);
    expect(result[1].layout).toEqual(validLayout);
  });

  it('should return empty array when no configs exist', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAll();

    expect(result).toEqual([]);
  });
});
