import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

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
    const updates: Partial<Session> = {
      name: 'Updated Name',
      description: 'Updated Description',
      summary: 'Updated summary',
      session_date: '2025-10-14',
    };

    await update('test-id-1', updates);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE sessions SET name = $1, description = $2, summary = $3, session_date = $4, updated_at = $5 WHERE id = $6',
      [
        'Updated Name',
        'Updated Description',
        'Updated summary',
        '2025-10-14',
        '2024-01-15T10:30:00.000Z',
        'test-id-1',
      ],
    );
  });

  it('should update only provided fields', async () => {
    const updates: Partial<Session> = {
      name: 'New Name Only',
    };

    await update('test-id-1', updates);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE sessions SET name = $1, updated_at = $2 WHERE id = $3',
      ['New Name Only', '2024-01-15T10:30:00.000Z', 'test-id-1'],
    );
  });

  it('should update active_view field', async () => {
    const updates: Partial<Session> = { active_view: 'ingame' };

    await update('test-id-1', updates);

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE sessions SET active_view = $1, updated_at = $2 WHERE id = $3',
      ['ingame', '2024-01-15T10:30:00.000Z', 'test-id-1'],
    );
  });

  it('should throw error when id is empty', async () => {
    const updates: Partial<Session> = { name: 'Test' };

    await expect(update('', updates)).rejects.toThrow(
      'Valid session ID is required',
    );
  });

  it('should throw error when id is whitespace only', async () => {
    const updates: Partial<Session> = { name: 'Test' };

    await expect(update('   ', updates)).rejects.toThrow(
      'Valid session ID is required',
    );
  });
});
