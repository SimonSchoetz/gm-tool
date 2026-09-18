import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { UpdateBaseEntityContentSectionInput } from '../types';

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

describe('update', () => {
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

  it('updates content', async () => {
    await update('section-id', { content: 'New content' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE base_entity_content_sections SET content = $1, updated_at = $2 WHERE id = $3',
      ['New content', '2024-01-15T10:30:00.000Z', 'section-id'],
    );
  });

  it('updates checked', async () => {
    await update('section-id', { checked: 1 });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE base_entity_content_sections SET checked = $1, updated_at = $2 WHERE id = $3',
      [1, '2024-01-15T10:30:00.000Z', 'section-id'],
    );
  });

  it('rejects a type outside BASE_ENTITY_CONTENT_SECTION_TYPES', async () => {
    await expect(
      update('section-id', {
        type: 'bogus',
      } as unknown as UpdateBaseEntityContentSectionInput),
    ).rejects.toThrow();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('throws when id is empty', async () => {
    await expect(update('', { content: 'New content' })).rejects.toThrow(
      'Valid Base entity content section ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('throws when no update fields are provided', async () => {
    await expect(update('section-id', {})).rejects.toThrow(
      'At least one field must be provided for update',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
