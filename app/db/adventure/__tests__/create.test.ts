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

  it('should insert adventure and return generated ID', async () => {
    const adventureId = await create();

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(adventureId).toBe('test-generated-id');
  });

  it('should create adventure with a default name prefixed "New adventure"', async () => {
    await create();

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values[1]).toMatch(/^New adventure /);
  });

  it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
    await create();

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values[2]).toBe('2024-01-15T10:30:00.000Z');
    expect(values[3]).toBe('2024-01-15T10:30:00.000Z');
  });
});
