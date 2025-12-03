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

  it('should insert adventure with all fields and return generated ID', async () => {
    const mockAdventure: CreateAdventureInput = {
      title: 'Test Adventure',
      description: 'Test Description',
    };

    mockExecute.mockResolvedValue({});

    const adventureId = await create(mockAdventure);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO adventures (id, title, description, image_id) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'Test Adventure', 'Test Description', null]
    );
    expect(adventureId).toBe('test-generated-id');
  });

  it('should insert adventure with only required fields', async () => {
    const mockAdventure: CreateAdventureInput = {
      title: 'Test Adventure',
    };

    mockExecute.mockResolvedValue({});

    const adventureId = await create(mockAdventure);

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO adventures (id, title, description, image_id) VALUES ($1, $2, $3, $4)',
      ['test-generated-id', 'Test Adventure', null, null]
    );
    expect(adventureId).toBe('test-generated-id');
  });

  it('should throw error when title is empty', async () => {
    const mockAdventure = {
      title: '',
    };

    await expect(create(mockAdventure)).rejects.toThrow(
      'Adventure title is required'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw error when title is only whitespace', async () => {
    const mockAdventure = {
      title: '   ',
    };

    await expect(create(mockAdventure)).rejects.toThrow(
      'Adventure title is required'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
