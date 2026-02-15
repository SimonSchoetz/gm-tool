import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreateAdventureInput } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      })
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
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should insert adventure and return generated ID', async () => {
    const mockAdventure: CreateAdventureInput = {
      name: 'Test Adventure',
    };

    mockExecute.mockResolvedValue({});

    const adventureId = await create(mockAdventure);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO adventures (id, name) VALUES ($1, $2)',
      ['test-generated-id', 'Test Adventure']
    );
    expect(adventureId).toBe('test-generated-id');
  });

  it('should allow empty name', async () => {
    const mockAdventure: CreateAdventureInput = {
      name: '',
    };

    mockExecute.mockResolvedValue({});

    const adventureId = await create(mockAdventure);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO adventures (id, name) VALUES ($1, $2)',
      ['test-generated-id', '']
    );
    expect(adventureId).toBe('test-generated-id');
  });
});
