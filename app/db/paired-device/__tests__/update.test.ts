import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
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

  it('should update name', async () => {
    await update('test-id', {
      name: 'Updated Name',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE paired_devices SET name = $1, updated_at = $2 WHERE id = $3',
      ['Updated Name', '2024-01-15T10:30:00.000Z', 'test-id'],
    );
  });

  it('should throw error when id is empty', async () => {
    await expect(update('', { name: 'Test' })).rejects.toThrow(
      'Valid paired device ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw error when no fields provided', async () => {
    await expect(update('test-id', {})).rejects.toThrow(
      'At least one field must be provided for update',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
