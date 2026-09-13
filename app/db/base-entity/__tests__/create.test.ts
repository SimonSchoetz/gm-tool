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

  it('should insert base entity and return generated ID', async () => {
    const id = await create('npcs', 'adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO base_entities'),
      expect.arrayContaining(['test-generated-id']),
    );
    expect(id).toBe('test-generated-id');
  });

  it('should set adventure_id, entity_type, default name, summary, and ISO timestamps', async () => {
    await create('npcs', 'adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO base_entities'),
      [
        'test-generated-id',
        'adventure-123',
        'npcs',
        expect.stringMatching(/^New NPC /),
        expect.stringContaining('"type":"root"'),
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
      ],
    );
  });

  it('should write a name matching New PC for pcs', async () => {
    await create('pcs', 'adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO base_entities'),
      expect.arrayContaining([expect.stringMatching(/^New PC /)]),
    );
  });

  it('should write the factions summary template', async () => {
    await create('factions', 'adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO base_entities'),
      expect.arrayContaining([
        expect.stringContaining('Leader | Type | Alignment'),
      ]),
    );
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('npcs', '')).rejects.toThrow(
      'Valid adventure ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
