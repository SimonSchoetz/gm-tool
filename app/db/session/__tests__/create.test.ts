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

vi.mock('../../../util', () => ({
  generateId: vi.fn(() => 'test-generated-id'),
}));

import { create } from '../create';

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should insert session including optional name when provided and return generated ID', async () => {
    const sessionId = await create({
      name: 'Test Session',
      active_view: 'prep',
      adventure_id: 'test-adventure-id',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, name, active_view, adventure_id) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'Test Session', 'prep', 'test-adventure-id'],
    );
    expect(sessionId).toBe('test-generated-id');
  });

  it('should insert session without name and return generated ID', async () => {
    const sessionId = await create({
      active_view: 'prep',
      adventure_id: 'test-adventure-id',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, active_view, adventure_id) VALUES ($1, $2, $3)',
      ['test-generated-id', 'prep', 'test-adventure-id'],
    );
    expect(sessionId).toBe('test-generated-id');
  });

  it('should throw error when adventure_id is missing', async () => {
    await expect(create({} as Parameters<typeof create>[0])).rejects.toThrow();
  });
});
