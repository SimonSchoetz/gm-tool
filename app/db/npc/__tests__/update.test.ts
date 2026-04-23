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

import { update } from '../update';

describe('update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should update name and produce correct SQL', async () => {
    await update('test-id', { name: 'Updated NPC' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE npcs SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['Updated NPC', 'test-id'],
    );
  });

  it('should update multiple fields', async () => {
    await update('test-id', { name: 'New Name', summary: 'New summary' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE npcs SET name = $1, summary = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['New Name', 'New summary', 'test-id'],
    );
  });

  it('should throw when id is empty', async () => {
    await expect(update('', { name: 'Test' })).rejects.toThrow(
      'Valid NPC ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when id is whitespace only', async () => {
    await expect(update('   ', { name: 'Test' })).rejects.toThrow(
      'Valid NPC ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when no update fields are provided', async () => {
    await expect(update('test-id', {})).rejects.toThrow(
      'At least one field must be provided for update',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
