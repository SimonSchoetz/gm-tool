import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({
      execute: mockExecute,
      select: mockSelect,
    })),
  },
}));

import { update } from '../update';

describe('update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should update all provided fields', async () => {
    const updates: Partial<Session> = {
      title: 'Updated Title',
      description: 'Updated Description',
      session_date: '2025-10-14',
      notes: 'Updated notes',
    };

    mockExecute.mockResolvedValue({});

    await update('test-id-1', updates);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE sessions SET title = $1, description = $2, session_date = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
      [
        'Updated Title',
        'Updated Description',
        '2025-10-14',
        'Updated notes',
        'test-id-1',
      ]
    );
  });

  it('should update only provided fields', async () => {
    const updates: Partial<Session> = {
      title: 'Updated Title Only',
    };

    mockExecute.mockResolvedValue({});

    await update('test-id-1', updates);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE sessions SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [
        'Updated Title Only',
        'test-id-1',
      ]
    );
  });

  it('should throw error when id is invalid', async () => {
    const updates: Partial<Session> = { title: 'Test' };

    await expect(update('', updates)).rejects.toThrow('Valid session ID is required');
    await expect(update('   ', updates)).rejects.toThrow('Valid session ID is required');
  });

  it('should throw error when title is empty string', async () => {
    const updates: Partial<Session> = { title: '' };

    await expect(update('test-id-1', updates)).rejects.toThrow('Session title cannot be empty');
  });

  it('should throw error when title is only whitespace', async () => {
    const updates: Partial<Session> = { title: '   ' };

    await expect(update('test-id-1', updates)).rejects.toThrow('Session title cannot be empty');
  });
});
