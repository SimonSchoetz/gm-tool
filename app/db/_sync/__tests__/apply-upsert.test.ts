import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
    ),
  },
}));

import { getDatabase } from '../../database';
import { applyUpsert } from '../apply-upsert';

const NPC_ROW = {
  id: 'npc-1',
  adventure_id: 'adv-1',
  name: 'Goblin',
  updated_at: '2024-06-01T00:00:00.000Z',
};

describe('applyUpsert', () => {
  beforeAll(async () => {
    // Warm the getDatabase() singleton once so the migration run's execute()
    // calls never leak into a test's own positional mock.calls assertions.
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    await getDatabase();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should skip an unknown table without querying', async () => {
    const result = await applyUpsert('not_a_table', NPC_ROW, false);

    expect(result).toBe('skipped');
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should skip a row without a string id', async () => {
    const result = await applyUpsert(
      'npcs',
      { ...NPC_ROW, id: undefined },
      false,
    );

    expect(result).toBe('skipped');
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should skip a row without a string updated_at', async () => {
    const result = await applyUpsert(
      'npcs',
      { ...NPC_ROW, updated_at: undefined },
      false,
    );

    expect(result).toBe('skipped');
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should drop a key outside the column whitelist', async () => {
    mockSelect.mockResolvedValue([]);

    await applyUpsert('npcs', { ...NPC_ROW, unknown_column: 'nope' }, false);

    const [sql] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).not.toContain('unknown_column');
    expect(sql).toContain('name');
  });

  it('should skip when the local row is not older', async () => {
    mockSelect.mockResolvedValue([{ updated_at: '2099-01-01T00:00:00.000Z' }]);

    const result = await applyUpsert('npcs', NPC_ROW, false);

    expect(result).toBe('skipped');
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should apply verbatim over an older local row', async () => {
    mockSelect.mockResolvedValue([{ updated_at: '2000-01-01T00:00:00.000Z' }]);

    const result = await applyUpsert('npcs', NPC_ROW, false);

    expect(result).toBe('applied');
    const [sql, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('ON CONFLICT(id) DO UPDATE');
    expect(values).toContain(NPC_ROW.updated_at);
  });

  it('should apply when no local row exists', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await applyUpsert('npcs', NPC_ROW, false);

    expect(result).toBe('applied');
  });

  it('should apply on equal timestamps when force is true', async () => {
    mockSelect.mockResolvedValue([{ updated_at: NPC_ROW.updated_at }]);

    const result = await applyUpsert('npcs', NPC_ROW, true);

    expect(result).toBe('applied');
  });

  it('should skip without throwing on a constraint failure', async () => {
    mockSelect.mockResolvedValue([]);
    mockExecute.mockRejectedValueOnce(
      new Error('FOREIGN KEY constraint failed'),
    );

    const result = await applyUpsert('npcs', NPC_ROW, false);

    expect(result).toBe('skipped');
  });

  it("should match table_config by table_name and delete the differently-id'd loser", async () => {
    mockSelect.mockResolvedValue([
      { id: 'local-config-id', updated_at: '2000-01-01T00:00:00.000Z' },
    ]);

    const result = await applyUpsert(
      'table_config',
      {
        id: 'incoming-config-id',
        table_name: 'npcs',
        color: 'blue',
        tagging_enabled: 1,
        scope: 'adventure',
        layout: '{}',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-06-01T00:00:00.000Z',
      },
      false,
    );

    expect(result).toBe('applied');
    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM table_config WHERE id = $1',
      ['local-config-id'],
    );
    const [insertSql, insertValues] = mockExecute.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(insertSql).toContain('INSERT INTO table_config');
    expect(insertValues).toContain('incoming-config-id');
  });
});
