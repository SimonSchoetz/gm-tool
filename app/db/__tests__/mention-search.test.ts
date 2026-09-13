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

  it('should search a base entity type scoped to adventureId when adventureId is not null', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);

    const result = await searchByName('npcs', 'gob', 'adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 AND adventure_id = $3 ORDER BY updated_at DESC`,
      ['npcs', '%gob%', 'adv-1'],
    );
    expect(result).toEqual([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);
  });

  it('should search a base entity type without adventureId filter when adventureId is null', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);

    const result = await searchByName('npcs', 'gob', null);

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 ORDER BY updated_at DESC`,
      ['npcs', '%gob%'],
    );
    expect(result).toEqual([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);
  });

  it('should search a non-base entity type scoped to adventureId', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Session One', updated_at: '2025-01-01' },
    ]);

    const result = await searchByName('sessions', 'ses', 'adv-1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM sessions WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC`,
      ['%ses%', 'adv-1'],
    );
    expect(result).toEqual([
      { id: '1', name: 'Session One', updated_at: '2025-01-01' },
    ]);
  });

  it('should search without adventureId filter when adventureId is null', async () => {
    mockSelect.mockResolvedValue([
      { id: '2', name: 'Tavern', updated_at: '2025-01-02' },
    ]);

    const result = await searchByName('adventures', 'tav', null);

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM adventures WHERE name LIKE $1 ORDER BY updated_at DESC`,
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

  it('should return an empty array for a non-entity table name without querying', async () => {
    const result = await searchByName('table_config', 'x', 'adv-1');

    expect(result).toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();
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

  it('returns the row for a base entity type when a matching id exists', async () => {
    mockSelect.mockResolvedValue([
      { id: '1', name: 'Goblin', updated_at: '2025-01-01' },
    ]);

    const result = await getById('npcs', '1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND id = $2`,
      ['npcs', '1'],
    );
    expect(result).toEqual({
      id: '1',
      name: 'Goblin',
      updated_at: '2025-01-01',
    });
  });

  it('returns the row for a non-base entity type when a matching id exists', async () => {
    mockSelect.mockResolvedValue([
      { id: 's-1', name: 'Session One', updated_at: '2025-01-01' },
    ]);

    const result = await getById('sessions', 's-1');

    expect(mockSelect).toHaveBeenCalledWith(
      `SELECT id, name, updated_at FROM sessions WHERE id = $1`,
      ['s-1'],
    );
    expect(result).toEqual({
      id: 's-1',
      name: 'Session One',
      updated_at: '2025-01-01',
    });
  });

  it('returns null when no row matches', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getById('npcs', 'missing-id');

    expect(result).toBeNull();
  });

  it('should return null for a non-entity table name without querying', async () => {
    const result = await getById('table_config', '1');

    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
