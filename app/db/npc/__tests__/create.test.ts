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

  it('should insert NPC and return generated ID', async () => {
    const npcId = await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO npcs'),
      expect.arrayContaining(['test-generated-id']),
    );
    expect(npcId).toBe('test-generated-id');
  });

  it('should set adventure_id, default name, summary, and ISO timestamps', async () => {
    await create('adventure-123');

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO npcs'),
      [
        'test-generated-id',
        'adventure-123',
        expect.stringMatching(/^New NPC /),
        expect.stringContaining('"type":"root"'),
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00.000Z',
      ],
    );
  });

  it('should throw when adventure_id is empty', async () => {
    await expect(create('')).rejects.toThrow('Valid adventure ID is required');
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
