import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addBaseEntityContentSectionsMigration } from '../1789743068849_add_base_entity_content_sections';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

const mockDb = {
  execute: mockExecute,
  select: mockSelect,
} as unknown as Parameters<typeof addBaseEntityContentSectionsMigration.up>[0];

const COPY_SUMMARIES_SQL =
  "INSERT INTO base_entity_content_sections (id, base_entity_id, name, type, content, sort_order, created_at, updated_at) SELECT id, id, 'Summary', 'text', summary, 0, created_at, updated_at FROM base_entities WHERE summary IS NOT NULL ON CONFLICT(id) DO NOTHING";
const DROP_SQL = 'ALTER TABLE base_entities DROP COLUMN summary';
const CONFIG_SELECT_SQL =
  'SELECT id, layout FROM table_config WHERE table_name IN ($1, $2, $3, $4, $5, $6)';
const CONFIG_UPDATE_SQL = 'UPDATE table_config SET layout = $1 WHERE id = $2';

const layoutWith = (
  searchableColumns: string[],
): {
  searchable_columns: string[];
  columns: { key: string; label: string; width: number }[];
  sort_state: { column: string; direction: string };
} => ({
  searchable_columns: searchableColumns,
  columns: [{ key: 'name', label: 'Name', width: 250 }],
  sort_state: { column: 'updated_at', direction: 'desc' },
});

describe('addBaseEntityContentSectionsMigration.up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockImplementation((sql: string) => {
      if (sql === 'PRAGMA table_info(base_entities)') {
        return Promise.resolve([{ name: 'id' }, { name: 'summary' }]);
      }
      if (sql === CONFIG_SELECT_SQL) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  it('creates base_entity_content_sections and its three sync triggers before copying any summary', async () => {
    await addBaseEntityContentSectionsMigration.up(mockDb);

    const calls = mockExecute.mock.calls as [string, unknown[]?][];
    expect(calls[0][0]).toContain(
      'CREATE TABLE IF NOT EXISTS base_entity_content_sections',
    );
    expect(calls[1][0]).toContain(
      'trg_sync_base_entity_content_sections_insert',
    );
    expect(calls[2][0]).toContain(
      'trg_sync_base_entity_content_sections_update',
    );
    expect(calls[3][0]).toContain(
      'trg_sync_base_entity_content_sections_delete',
    );

    const copyIndex = calls.findIndex(([sql]) => sql === COPY_SUMMARIES_SQL);
    expect(copyIndex).toBeGreaterThan(3);
  });

  it('copies every non-null summary into a text section keyed by the base entity id', async () => {
    await addBaseEntityContentSectionsMigration.up(mockDb);

    expect(mockExecute).toHaveBeenCalledWith(COPY_SUMMARIES_SQL);
  });

  it('drops the summary column after copying', async () => {
    await addBaseEntityContentSectionsMigration.up(mockDb);

    expect(mockExecute).toHaveBeenCalledWith(DROP_SQL);

    const calls = mockExecute.mock.calls as [string, unknown[]?][];
    const copyIndex = calls.findIndex(([sql]) => sql === COPY_SUMMARIES_SQL);
    const dropIndex = calls.findIndex(([sql]) => sql === DROP_SQL);
    expect(dropIndex).toBeGreaterThan(copyIndex);
  });

  it('skips the copy and the drop when base_entities no longer has a summary column', async () => {
    mockSelect.mockImplementation((sql: string) => {
      if (sql === 'PRAGMA table_info(base_entities)') {
        return Promise.resolve([{ name: 'id' }, { name: 'name' }]);
      }
      if (sql === CONFIG_SELECT_SQL) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await addBaseEntityContentSectionsMigration.up(mockDb);

    expect(mockExecute).not.toHaveBeenCalledWith(COPY_SUMMARIES_SQL);
    expect(mockExecute).not.toHaveBeenCalledWith(DROP_SQL);
    expect(mockSelect).toHaveBeenCalledWith(
      CONFIG_SELECT_SQL,
      expect.anything(),
    );
  });

  it('reads the table_config rows of exactly the six base entity tables', async () => {
    await addBaseEntityContentSectionsMigration.up(mockDb);

    expect(mockSelect).toHaveBeenCalledWith(CONFIG_SELECT_SQL, [
      'npcs',
      'foes',
      'pcs',
      'factions',
      'locations',
      'items',
    ]);
  });

  it('removes summary from the searchable_columns of a table_config row that still lists it', async () => {
    mockSelect.mockImplementation((sql: string) => {
      if (sql === 'PRAGMA table_info(base_entities)') {
        return Promise.resolve([{ name: 'id' }, { name: 'summary' }]);
      }
      if (sql === CONFIG_SELECT_SQL) {
        return Promise.resolve([
          {
            id: 'config-npcs',
            layout: JSON.stringify(
              layoutWith(['name', 'summary', 'description']),
            ),
          },
        ]);
      }
      return Promise.resolve([]);
    });

    await addBaseEntityContentSectionsMigration.up(mockDb);

    expect(mockExecute).toHaveBeenCalledWith(CONFIG_UPDATE_SQL, [
      JSON.stringify(layoutWith(['name', 'description'])),
      'config-npcs',
    ]);
  });

  it('leaves a table_config row untouched when its searchable_columns no longer lists summary', async () => {
    mockSelect.mockImplementation((sql: string) => {
      if (sql === 'PRAGMA table_info(base_entities)') {
        return Promise.resolve([{ name: 'id' }, { name: 'summary' }]);
      }
      if (sql === CONFIG_SELECT_SQL) {
        return Promise.resolve([
          {
            id: 'config-foes',
            layout: JSON.stringify(layoutWith(['name', 'description'])),
          },
        ]);
      }
      return Promise.resolve([]);
    });

    await addBaseEntityContentSectionsMigration.up(mockDb);

    const calls = mockExecute.mock.calls as [string, unknown[]?][];
    expect(calls.some(([sql]) => sql === CONFIG_UPDATE_SQL)).toBe(false);
  });
});
