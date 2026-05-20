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
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should insert session step with required fields and return ID', async () => {
    const stepId = await create({ session_id: 'session-123', sort_order: 0 });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO session_steps (id, session_id, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [
        'test-generated-id',
        'session-123',
        0,
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
      ],
    );
    expect(stepId).toBe('test-generated-id');
  });

  it('should include default_step_key and name when provided', async () => {
    await create({
      session_id: 'session-123',
      sort_order: 1,
      default_step_key: 'strong_start',
      name: 'Strong Start',
    });

    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('default_step_key');
    expect(sql).toContain('name');
    expect(values).toContain('strong_start');
    expect(values).toContain('Strong Start');
  });

  it('should throw when session_id is empty', async () => {
    await expect(create({ session_id: '', sort_order: 0 })).rejects.toThrow(
      'Valid session ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
