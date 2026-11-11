import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as mentionSearchDb from '@db/mention-search';
import { buildTableConfig } from './support/tableConfigFixtures';

const searchByName = vi.hoisted(() =>
  vi.fn<typeof mentionSearchDb.searchByName>(),
);
const getById = vi.hoisted(() => vi.fn<typeof mentionSearchDb.getById>());

vi.mock('@db/mention-search', () => ({ searchByName, getById }));

beforeEach(() => {
  vi.resetModules();
  searchByName.mockReset().mockResolvedValue([]);
  getById.mockReset().mockResolvedValue(null);
});

describe('searchMentions', () => {
  it('searches each entity table config with tagging enabled, scoped to the adventure for an adventure scope and to none for a global one', async () => {
    const { searchMentions } = await import('../mentionSearchService');

    await searchMentions('gob', 'adventure-1', [
      buildTableConfig({ table_name: 'npcs', scope: 'adventure' }),
      buildTableConfig({ id: 'c2', table_name: 'foes', scope: 'global' }),
    ]);

    expect(searchByName.mock.calls).toEqual([
      ['npcs', 'gob', 'adventure-1'],
      ['foes', 'gob', null],
    ]);
  });

  it('skips a config with tagging disabled and a config whose table is no entity type', async () => {
    const { searchMentions } = await import('../mentionSearchService');

    await searchMentions('gob', 'adventure-1', [
      buildTableConfig({ id: 'off', table_name: 'npcs', tagging_enabled: 0 }),
      buildTableConfig({ id: 'other', table_name: 'widgets' }),
      buildTableConfig({ id: 'on', table_name: 'foes' }),
    ]);

    expect(searchByName.mock.calls.map(([table]) => table)).toEqual(['foes']);
  });

  it("enriches each row with its config's table, color and scope, newest first across tables", async () => {
    const { searchMentions } = await import('../mentionSearchService');
    searchByName.mockImplementation((table) =>
      Promise.resolve(
        table === 'npcs'
          ? [
              { id: 'n-old', name: 'Old', updated_at: '2026-01-01T00:00:00Z' },
              { id: 'n-new', name: 'New', updated_at: '2026-03-01T00:00:00Z' },
            ]
          : [{ id: 'f-mid', name: 'Mid', updated_at: '2026-02-01T00:00:00Z' }],
      ),
    );

    const results = await searchMentions('x', 'adventure-1', [
      buildTableConfig({ table_name: 'npcs', color: '#111111' }),
      buildTableConfig({
        id: 'c2',
        table_name: 'foes',
        color: '#222222',
        scope: 'global',
      }),
    ]);

    expect(results).toEqual([
      {
        id: 'n-new',
        name: 'New',
        tableName: 'npcs',
        color: '#111111',
        adventureId: 'adventure-1',
        updatedAt: '2026-03-01T00:00:00Z',
      },
      {
        id: 'f-mid',
        name: 'Mid',
        tableName: 'foes',
        color: '#222222',
        adventureId: null,
        updatedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'n-old',
        name: 'Old',
        tableName: 'npcs',
        color: '#111111',
        adventureId: 'adventure-1',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);
  });

  it('returns no result for no config', async () => {
    const { searchMentions } = await import('../mentionSearchService');

    await expect(searchMentions('x', 'adventure-1', [])).resolves.toEqual([]);
    expect(searchByName).not.toHaveBeenCalled();
  });

  it('rejects as MentionSearchError when a search fails', async () => {
    const { searchMentions } = await import('../mentionSearchService');
    searchByName.mockRejectedValue(new Error('disk'));

    await expect(
      searchMentions('x', 'adventure-1', [buildTableConfig()]),
    ).rejects.toMatchObject({ name: 'MentionSearchError' });
  });
});

describe('getMentionEntityData', () => {
  it('returns the name of a found entity as not deleted', async () => {
    const { getMentionEntityData } = await import('../mentionSearchService');
    getById.mockResolvedValue({
      id: 'n1',
      name: 'Goblin',
      updated_at: '2026-01-01T00:00:00Z',
    });

    await expect(getMentionEntityData('npcs', 'n1')).resolves.toEqual({
      name: 'Goblin',
      deleted: false,
    });
    expect(getById).toHaveBeenCalledWith('npcs', 'n1');
  });

  it('returns a deleted entity, without a lookup, for a type that is no entity type', async () => {
    const { getMentionEntityData } = await import('../mentionSearchService');

    await expect(getMentionEntityData('widgets', 'w1')).resolves.toEqual({
      name: null,
      deleted: true,
    });
    expect(getById).not.toHaveBeenCalled();
  });

  it('returns a deleted entity when the row is gone', async () => {
    const { getMentionEntityData } = await import('../mentionSearchService');

    await expect(getMentionEntityData('npcs', 'gone')).resolves.toEqual({
      name: null,
      deleted: true,
    });
  });

  it('rejects as MentionSearchError when the lookup fails', async () => {
    const { getMentionEntityData } = await import('../mentionSearchService');
    getById.mockRejectedValue(new Error('disk'));

    await expect(getMentionEntityData('npcs', 'n1')).rejects.toMatchObject({
      name: 'MentionSearchError',
    });
  });
});
