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
    generateId: vi.fn(() => 'new-npc-id'),
  };
});

const mockGet = vi.fn();
vi.mock('../get', () => ({
  get: (entityType: string, id: string) => mockGet(entityType, id) as unknown,
}));

import { duplicate } from '../duplicate';

const sourceRow = {
  id: 'source-npc-id',
  adventure_id: 'adventure-123',
  entity_type: 'npcs',
  name: 'Gundren Rockseeker',
  summary: 'a dwarf merchant',
  description: 'Long lost brother',
  image_id: 'source-image-id',
  pinned_order: 3,
  created_at: '2023-05-01T08:00:00.000Z',
  updated_at: '2023-05-02T08:00:00.000Z',
};

const INSERT_SQL =
  'INSERT INTO base_entities (id, adventure_id, entity_type, summary, description, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

describe('base-entity.duplicate', () => {
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

  it('fetches the source scoped to the given type', async () => {
    await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(mockGet).toHaveBeenCalledWith('npcs', 'source-npc-id');
  });

  it('omits name so the duplicate has no name', async () => {
    await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, expect.any(Array));
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(/^INSERT INTO base_entities \([^)]*\bname\b/),
      expect.anything(),
    );
  });

  it('copies every other source column', async () => {
    await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-npc-id',
      'adventure-123',
      'npcs',
      'a dwarf merchant',
      'Long lost brother',
      'new-image-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it("writes the passed image id, not the source's", async () => {
    await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(mockExecute).toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['new-image-id']),
    );
    expect(mockExecute).not.toHaveBeenCalledWith(
      INSERT_SQL,
      expect.arrayContaining(['source-image-id']),
    );
  });

  it('writes a null image id when passed null', async () => {
    await duplicate('npcs', 'source-npc-id', null);

    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-npc-id',
      'adventure-123',
      'npcs',
      'a dwarf merchant',
      'Long lost brother',
      null,
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('generates a fresh id and timestamps', async () => {
    const result = await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(result).toBe('new-npc-id');
    expect(mockExecute).toHaveBeenCalledWith(INSERT_SQL, [
      'new-npc-id',
      'adventure-123',
      'npcs',
      'a dwarf merchant',
      'Long lost brother',
      'new-image-id',
      '2024-01-15T10:30:00.000Z',
      '2024-01-15T10:30:00.000Z',
    ]);
  });

  it('throws when the source row does not exist', async () => {
    mockGet.mockResolvedValue(null);

    await expect(duplicate('npcs', 'missing-npc-id', null)).rejects.toThrow(
      'NPC not found: missing-npc-id',
    );
  });

  it('omits pinned_order so the duplicate starts unpinned', async () => {
    await duplicate('npcs', 'source-npc-id', 'new-image-id');

    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringMatching(
        /^INSERT INTO base_entities \([^)]*\bpinned_order\b/,
      ),
      expect.anything(),
    );
  });
});
