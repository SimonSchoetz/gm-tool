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
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should insert foe and return generated ID', async () => {
    const foeId = await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO foes'),
      expect.arrayContaining(['test-generated-id']),
    );
    expect(foeId).toBe('test-generated-id');
  });

  it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
    await create('adventure-123');

    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO foes');
    expect(values).toContain('adventure-123');
    const name = values[2] as string;
    expect(name).toMatch(/^New Foe /);
    expect(values).toContain('2024-01-15T10:30:00.000Z');
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
