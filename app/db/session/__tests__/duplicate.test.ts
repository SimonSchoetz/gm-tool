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
    generateId: vi.fn(() => 'new-session-id'),
  };
});

const mockGet = vi.fn();
vi.mock('../get', () => ({
  get: (id: string) => mockGet(id) as unknown,
}));

import { duplicate } from '../duplicate';

const sourceRow = {
  id: 'source-session-id',
  name: 'The Goblin Ambush',
  description: 'First session of the campaign',
  summary: 'They met on the road',
  session_date: '2024-03-01',
  active_view: 'ingame',
  adventure_id: 'adventure-123',
  pinned_order: 3,
  created_at: '2023-05-01T08:00:00.000Z',
  updated_at: '2023-05-02T08:00:00.000Z',
};

const INSERT_SQL =
  'INSERT INTO sessions (id, description, summary, session_date, active_view, adventure_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

const EXPECTED_VALUES = [
  'new-session-id',
  'First session of the campaign',
  'They met on the road',
  '2024-03-01',
  'ingame',
  'adventure-123',
  '2024-01-15T10:30:00.000Z',
  '2024-01-15T10:30:00.000Z',
];

describe('session.duplicate', () => {
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
    await duplicate('source-session-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, expect.any(Array));
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO sessions \([^)]*\bname\b/),
      expect.anything(),
    );
  });

  it('copies active_view from the source row', async () => {
    await duplicate('source-session-id');

    expect(mockExecute).toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['ingame']),
    );
  });

  it('copies the remaining session columns', async () => {
    await duplicate('source-session-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, EXPECTED_VALUES);
  });

  it('generates a fresh id and fresh timestamps', async () => {
    const result = await duplicate('source-session-id');

    expect(result).toBe('new-session-id');
    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, EXPECTED_VALUES);
    expect(mockExecute).not.toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['2023-05-01T08:00:00.000Z']),
    );
  });

  it('throws when the source session does not exist', async () => {
    mockGet.mockResolvedValue(null);

    await expect(duplicate('missing-session-id')).rejects.toThrow(
      'Session not found: missing-session-id',
    );
  });

  it('omits pinned_order so the duplicate starts unpinned', async () => {
    await duplicate('source-session-id');

    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO sessions \([^)]*\bpinned_order\b/),
      expect.anything(),
    );
  });
});
