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

vi.mock('../../../util', () => ({
  generateId: vi.fn(() => 'test-generated-id'),
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

  it('should insert session with all fields and return generated ID', async () => {
    const mockSession: Session = {
      title: 'Test Session',
      description: 'Test Description',
      session_date: '2025-10-13',
      notes: 'Test notes',
    };

    mockExecute.mockResolvedValue({});

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, title, description, session_date, notes) VALUES ($1, $2, $3, $4, $5)',
      [
        'test-generated-id',
        'Test Session',
        'Test Description',
        '2025-10-13',
        'Test notes',
      ]
    );
    expect(sessionId).toBe('test-generated-id');
    expect(typeof sessionId).toBe('string');
  });

  it('should insert session with only required fields', async () => {
    const mockSession: Session = {
      title: 'Minimal Session',
    };

    mockExecute.mockResolvedValue({});

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, title, description, session_date, notes) VALUES ($1, $2, $3, $4, $5)',
      [
        'test-generated-id',
        'Minimal Session',
        null,
        null,
        null,
      ]
    );
    expect(sessionId).toBe('test-generated-id');
    expect(typeof sessionId).toBe('string');
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
