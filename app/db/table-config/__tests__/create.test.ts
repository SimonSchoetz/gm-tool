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

vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'test-generated-id'),
  };
});

import { create } from '../create';

const validLayout: TableLayout = {
  searchable_columns: ['name'],
  columns: [{ key: 'name', label: 'Name', width: 200 }],
  sort_state: { column: 'name', direction: 'asc' },
};

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should create table config and return generated ID', async () => {
    const result = await create({
      table_name: 'npcs',
      color: '#3498db',
      tagging_enabled: 1,
      scope: 'adventure',
      layout: validLayout,
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO table_config (id, table_name, color, layout, created_at, updated_at, tagging_enabled, scope) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        'test-generated-id',
        'npcs',
        '#3498db',
        JSON.stringify(validLayout),
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
        1,
        'adventure',
      ],
    );
    expect(result).toBe('test-generated-id');
  });

  it('should omit tagging_enabled and scope from INSERT when not provided', async () => {
    await create({
      table_name: 'test',
      color: '#fff',
      layout: {
        searchable_columns: [],
        columns: [],
        sort_state: { column: 'name', direction: 'asc' },
      },
    });

    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).not.toContain('tagging_enabled');
    expect(sql).not.toContain('scope');
  });

  it('should throw when layout is invalid', async () => {
    await expect(
      create({
        table_name: 'npcs',
        color: '#000',
        tagging_enabled: 1,
        scope: 'adventure',
        layout: {} as TableLayout,
      }),
    ).rejects.toThrow('Invalid layout');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
