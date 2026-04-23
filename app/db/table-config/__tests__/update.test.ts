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

import { update } from '../update';

const validLayout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 200 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should update table_name and produce correct SQL', async () => {
    await update('test-id', { table_name: 'sessions' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE table_config SET table_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['sessions', 'test-id'],
    );
  });

  it('should serialize and update layout', async () => {
    await update('test-id', { layout: validLayout });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE table_config SET layout = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(validLayout), 'test-id'],
    );
  });

  it('should throw when id is empty', async () => {
    await expect(update('', { table_name: 'test' })).rejects.toThrow(
      'Valid table config ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when id is whitespace only', async () => {
    await expect(update('   ', { table_name: 'test' })).rejects.toThrow(
      'Valid table config ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when no update fields are provided', async () => {
    await expect(update('test-id', {})).rejects.toThrow(
      'At least one field must be provided for update',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when layout is invalid', async () => {
    await expect(
      update('test-id', {
        layout: { invalid: true } as unknown as TableLayout,
      }),
    ).rejects.toThrow('Invalid layout');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
