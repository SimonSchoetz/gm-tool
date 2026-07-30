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
    generateId: vi.fn(() => 'new-pc-id'),
  };
});

const mockGet = vi.fn();
vi.mock('../get', () => ({
  get: (id: string) => mockGet(id) as unknown,
}));

import { duplicate } from '../duplicate';

const sourceRow = {
  id: 'source-pc-id',
  adventure_id: 'adventure-123',
  name: 'Gundren Rockseeker',
  summary: 'a dwarf merchant',
  description: 'Long lost brother',
  image_id: 'source-image-id',
  created_at: '2023-05-01T08:00:00.000Z',
  updated_at: '2023-05-02T08:00:00.000Z',
};

const INSERT_SQL =
  'INSERT INTO pcs (id, adventure_id, summary, description, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)';

describe('pc.duplicate', () => {
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
    await duplicate('source-pc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, expect.any(Array));
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO pcs \([^)]*\bname\b/),
      expect.anything(),
    );
  });

  it('copies every other source column', async () => {
    await duplicate('source-pc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-pc-id',
      'adventure-123',
      'a dwarf merchant',
      'Long lost brother',
      'new-image-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it("writes the passed image id, not the source's", async () => {
    await duplicate('source-pc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['new-image-id']),
    );
    expect(mockExecute).not.toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['source-image-id']),
    );
  });

  it('writes null image id when passed null', async () => {
    await duplicate('source-pc-id', null);

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-pc-id',
      'adventure-123',
      'a dwarf merchant',
      'Long lost brother',
      null,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('generates a fresh id and fresh timestamps', async () => {
    const result = await duplicate('source-pc-id', 'new-image-id');

    expect(result).toBe('new-pc-id');
    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-pc-id',
      'adventure-123',
      'a dwarf merchant',
      'Long lost brother',
      'new-image-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('throws when the source row does not exist', async () => {
    mockGet.mockResolvedValue(null);

    await expect(duplicate('missing-pc-id', null)).rejects.toThrow(
      'Pc not found: missing-pc-id',
    );
  });
});
