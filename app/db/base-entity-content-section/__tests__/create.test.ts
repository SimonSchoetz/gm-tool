import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('inserts a section with base_entity_id, type, sort_order and timestamps and returns its id', async () => {
    const sectionId = await create({
      base_entity_id: 'entity-123',
      type: 'text',
      sort_order: 0,
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO base_entity_content_sections (id, base_entity_id, type, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        'test-generated-id',
        'entity-123',
        'text',
        0,
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
      ],
    );
    expect(sectionId).toBe('test-generated-id');
  });

  it('includes name when provided', async () => {
    await create({
      base_entity_id: 'entity-123',
      type: 'text',
      sort_order: 0,
      name: 'Summary',
    });

    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('name');
    expect(values).toContain('Summary');
  });

  it('throws when base_entity_id is empty', async () => {
    await expect(
      create({ base_entity_id: '', type: 'text', sort_order: 0 }),
    ).rejects.toThrow('Valid Base entity ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
