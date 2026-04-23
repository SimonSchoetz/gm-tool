import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreateSessionStepInput } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
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

  it('should create session step with only required fields', async () => {
    const result = await create({ session_id: 'sess-1', sort_order: 0 });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO session_steps (id, session_id, sort_order) VALUES ($1, $2, $3)',
      ['test-generated-id', 'sess-1', 0],
    );
    expect(result).toBe('test-generated-id');
  });

  it('should create session step with optional name included', async () => {
    const result = await create({
      session_id: 'sess-1',
      sort_order: 1,
      name: 'Strong Start',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO session_steps (id, session_id, name, sort_order) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'sess-1', 'Strong Start', 1],
    );
    expect(result).toBe('test-generated-id');
  });

  it('should throw when session_id is missing', async () => {
    const input = { sort_order: 0 } as CreateSessionStepInput;
    await expect(create(input)).rejects.toThrow();
  });
});
