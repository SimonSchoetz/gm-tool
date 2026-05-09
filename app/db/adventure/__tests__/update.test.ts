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
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should update all provided fields', async () => {
    await update('test-id', {
      name: 'Updated Name',
      description: 'Updated Description',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE adventures SET name = $1, description = $2, updated_at = $3 WHERE id = $4',
      [
        'Updated Name',
        'Updated Description',
        '2024-01-15T10:30:00.000Z',
        'test-id',
      ],
    );
  });

  it('should update only name', async () => {
    await update('test-id', {
      name: 'Updated Name',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE adventures SET name = $1, updated_at = $2 WHERE id = $3',
      ['Updated Name', '2024-01-15T10:30:00.000Z', 'test-id'],
    );
  });

  it('should throw error when id is empty', async () => {
    await expect(update('', { name: 'Test' })).rejects.toThrow(
      'Valid adventure ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should allow empty name', async () => {
    await update('test-id', { name: '' });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE adventures SET name = $1, updated_at = $2 WHERE id = $3',
      ['', '2024-01-15T10:30:00.000Z', 'test-id'],
    );
  });
});
