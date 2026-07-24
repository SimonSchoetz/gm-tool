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

import { searchByName, getById } from '../mention-search';

describe('searchByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should search with LIKE pattern scoped to adventureId when adventureId is not null', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);

    const result = await searchByName('npcs', 'gob', 'adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM npcs WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC`,
      ['%gob%', 'adv-1'],
    );
    expect(result).toEqual([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);
  });

  it('should search without adventureId filter when adventureId is null', async () => {
    mockSelect.mockResolvedValue([
      { id: '2', name: 'Tavern', updated_at: '2025-01-02' },
    ]);

    const result = await searchByName('places', 'tav', null);

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM places WHERE name LIKE $1 ORDER BY updated_at DESC`,
      ['%tav%'],
    );
    expect(result).toEqual([
      { id: '2', name: 'Tavern', updated_at: '2025-01-02' },
    ]);
  });

  it('should return empty array when no results match', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await searchByName('npcs', 'zzz', 'adv-1');

    expect(result).toEqual([]);
  });
});

describe('getById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns the row when a matching id exists', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);

    const result = await getById('npcs', '1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM npcs WHERE id = $1`,
      ['1'],
    );
    expect(result).toEqual({
      id: '1',
      name: 'Goblin',
      updated_at: '2025-01-01',
    });
  });

  it('returns null when no row matches', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getById('npcs', 'missing-id');

    expect(result).toBeNull();
  });
});
