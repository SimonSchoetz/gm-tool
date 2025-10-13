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

import { create } from '../create';

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should insert session with all fields', async () => {
    const mockSession: Session = {
      title: 'Test Session',
      description: 'Test Description',
      session_date: '2025-10-13',
      notes: 'Test notes',
    };

    mockExecute.mockResolvedValue({ lastInsertId: 1 });

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)',
      [
        'Test Session',
        'Test Description',
        '2025-10-13',
        'Test notes',
      ]
    );
    expect(sessionId).toBe(1);
  });

  it('should insert session with only required fields', async () => {
    const mockSession: Session = {
      title: 'Minimal Session',
    };

    mockExecute.mockResolvedValue({ lastInsertId: 2 });

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)',
      [
        'Minimal Session',
        null,
        null,
        null,
      ]
    );
    expect(sessionId).toBe(2);
  });

  it('should throw error when title is empty', async () => {
    const mockSession: Session = {
      title: '',
    };

    await expect(create(mockSession)).rejects.toThrow('Session title is required');
  });

  it('should throw error when title is only whitespace', async () => {
    const mockSession: Session = {
      title: '   ',
    };

    await expect(create(mockSession)).rejects.toThrow('Session title is required');
  });
});
