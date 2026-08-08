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
    generateId: vi.fn(() => 'new-encounter-id'),
  };
});

const mockGet = vi.fn();
vi.mock('../get', () => ({
  get: (id: string) => mockGet(id) as unknown,
}));

import { duplicate } from '../duplicate';

const sourceRow = {
  id: 'source-encounter-id',
  adventure_id: 'adventure-123',
  name: 'Goblin Ambush',
  description: 'Three goblins behind the rocks',
  pinned_order: 3,
  created_at: '2023-05-01T08:00:00.000Z',
  updated_at: '2023-05-02T08:00:00.000Z',
};

const INSERT_SQL =
  'INSERT INTO encounters (id, adventure_id, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)';

describe('encounter.duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    mockGet.mockResolvedValue(sourceRow);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('omits name so the duplicate has no name', async () => {
    await duplicate('source-encounter-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, expect.any(Array));
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO encounters \([^)]*\bname\b/),
      expect.anything(),
    );
  });

  it('copies every other source column', async () => {
    await duplicate('source-encounter-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-encounter-id',
      'adventure-123',
      'Three goblins behind the rocks',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('generates a fresh id and fresh timestamps', async () => {
    const result = await duplicate('source-encounter-id');

    expect(result).toBe('new-encounter-id');
    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-encounter-id',
      'adventure-123',
      'Three goblins behind the rocks',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('throws when the source row does not exist', async () => {
    mockGet.mockResolvedValue(null);

    await expect(duplicate('missing-encounter-id')).rejects.toThrow(
      'Encounter not found: missing-encounter-id',
    );
  });

  it('omits pinned_order so the duplicate starts unpinned', async () => {
    await duplicate('source-encounter-id');

    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO encounters \([^)]*\bpinned_order\b/),
      expect.anything(),
    );
  });
});
