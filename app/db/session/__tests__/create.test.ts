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

vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => 'test-generated-id'),
  };
});

import { create } from '../create';

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should insert session and return generated ID', async () => {
    const sessionId = await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, adventure_id, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [
        'test-generated-id',
        'adventure-123',
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
      ],
    );
    expect(sessionId).toBe('test-generated-id');
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
