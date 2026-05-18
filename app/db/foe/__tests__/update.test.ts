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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should update name and produce correct SQL', async () => {
    await update('test-id', { name: 'Updated Foe' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE foes SET name = $1, updated_at = $2 WHERE id = $3',
      ['Updated Foe', '2024-01-15T10:30:00.000Z', 'test-id'],
    );
  });

  it('should update multiple fields', async () => {
    await update('test-id', { name: 'New Name', summary: 'New summary' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE foes SET name = $1, summary = $2, updated_at = $3 WHERE id = $4',
      ['New Name', 'New summary', '2024-01-15T10:30:00.000Z', 'test-id'],
    );
  });

  it('should throw when id is empty', async () => {
    await expect(update('', { name: 'Test' })).rejects.toThrow(
      'Valid Foe ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw when id is whitespace only', async () => {
    await expect(update('   ', { name: 'Test' })).rejects.toThrow(
      'Valid Foe ID is required',
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
