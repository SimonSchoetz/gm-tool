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
    const mockSession = {
      id: 'test-session-id',
      title: 'Test Session',
      description: 'Test Description',
      session_date: '2025-10-13',
      notes: 'Test notes',
      adventure_id: 'test-adventure-id',
    };

    mockExecute.mockResolvedValue({});

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, title, description, session_date, notes, adventure_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        'test-generated-id',
        'Test Session',
        'Test Description',
        '2025-10-13',
        'Test notes',
        'test-adventure-id',
      ]
    );
    expect(sessionId).toBe('test-generated-id');
    expect(typeof sessionId).toBe('string');
  });

  it('should insert session with only required fields', async () => {
    const mockSession = {
      id: 'test-session-id-2',
      title: 'Minimal Session',
      adventure_id: 'test-adventure-id',
    };

    mockExecute.mockResolvedValue({});

    const sessionId = await create(mockSession);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, title, description, session_date, notes, adventure_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        'test-generated-id',
        'Minimal Session',
        null,
        null,
        null,
        'test-adventure-id',
      ]
    );
    expect(sessionId).toBe('test-generated-id');
    expect(typeof sessionId).toBe('string');
  });

  it('should throw error when title is empty', async () => {
    const mockSession = {
      title: '',
      adventure_id: 'test-adventure-id',
    };

    await expect(create(mockSession)).rejects.toThrow('Session title is required');
  });

  it('should throw error when title is only whitespace', async () => {
    const mockSession = {
      title: '   ',
      adventure_id: 'test-adventure-id',
    };

    await expect(create(mockSession)).rejects.toThrow('Session title is required');
  });

  it('should throw error when adventure_id is missing', async () => {
    const mockSession = {
      title: 'Test Session',
    };

    await expect(create(mockSession)).rejects.toThrow();
  });
});
