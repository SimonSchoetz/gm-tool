import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreateNpcInput } from '../types';

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

  it('should insert NPC with required fields and return generated ID', async () => {
    const result = await create({
      adventure_id: 'test-adventure-id',
      name: 'Test NPC',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO npcs (id, adventure_id, name, summary) VALUES ($1, $2, $3, $4)',
      [
        'test-generated-id',
        'test-adventure-id',
        'Test NPC',
        expect.any(String),
      ],
    );
    expect(result).toBe('test-generated-id');
  });

  it('should allow empty name', async () => {
    const result = await create({
      adventure_id: 'test-adventure-id',
      name: '',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO npcs (id, adventure_id, name, summary) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'test-adventure-id', '', expect.any(String)],
    );
    expect(result).toBe('test-generated-id');
  });

  it('should throw when adventure_id is missing', async () => {
    const input = { name: 'Test NPC' } as CreateNpcInput;
    await expect(create(input)).rejects.toThrow();
  });
});
