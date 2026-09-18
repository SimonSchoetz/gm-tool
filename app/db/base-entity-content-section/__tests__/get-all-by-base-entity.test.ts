import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BaseEntityContentSection } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { getAllByBaseEntity } from '../get-all-by-base-entity';

describe('getAllByBaseEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns the sections of a base entity ordered by sort_order', async () => {
    const section1: BaseEntityContentSection = {
      id: 'section-1',
      base_entity_id: 'entity-123',
      name: 'Summary',
      type: 'text',
      content: 'A dwarven merchant',
      checked: 0,
      sort_order: 0,
      created_at: '2024-01-15T10:30:00.000Z',
      updated_at: '2024-01-15T10:30:00.000Z',
    };
    const section2: BaseEntityContentSection = {
      id: 'section-2',
      base_entity_id: 'entity-123',
      name: null,
      type: '5e-stat-block',
      content: null,
      checked: 0,
      sort_order: 1,
      created_at: '2024-01-15T10:30:00.000Z',
      updated_at: '2024-01-15T10:30:00.000Z',
    };

    mockSelect.mockResolvedValue([section1, section2]);

    const result = await getAllByBaseEntity('entity-123');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order ASC',
      ['entity-123'],
    );
    expect(result).toEqual([section1, section2]);
  });

  it('throws when baseEntityId is empty', async () => {
    await expect(getAllByBaseEntity('')).rejects.toThrow(
      'Valid Base entity ID is required',
    );
  });
});
