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
import { applyDelete } from '../apply-delete';

describe('applyDelete', () => {
  beforeAll(async () => {
    // Warm the getDatabase() singleton once so the migration run's execute()
    // calls never leak into a test's own call-count assertions below.
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
    const result = await applyDelete(
      'not_a_table',
      'row-1',
      '2024-01-01T00:00:00.000Z',
    );

    expect(result).toBe('skipped');
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should skip when the local row is newer than the deletion', async () => {
    mockSelect.mockResolvedValue([{ updated_at: '2099-01-01T00:00:00.000Z' }]);

    const result = await applyDelete(
      'npcs',
      'npc-1',
      '2024-01-01T00:00:00.000Z',
    );

    expect(result).toBe('skipped');
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should delete an older local row and upsert the origin deletion time', async () => {
    mockSelect.mockResolvedValue([{ updated_at: '2000-01-01T00:00:00.000Z' }]);

    const result = await applyDelete(
      'npcs',
      'npc-1',
      '2024-01-01T00:00:00.000Z',
    );

    expect(result).toBe('applied');
    expect(mockExecute).toHaveBeenCalledWith('DELETE FROM npcs WHERE id = $1', [
      'npc-1',
    ]);
    const tombstoneCall = mockExecute.mock.calls.find(([sql]) =>
      (sql as string).includes('INSERT INTO _sync_changes'),
    );
    expect(tombstoneCall).toBeDefined();
    const [, tombstoneValues] = tombstoneCall as [string, unknown[]];
    expect(tombstoneValues).toContain('2024-01-01T00:00:00.000Z');
  });

  it('should record the tombstone without a domain-table delete when no local row exists', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await applyDelete(
      'npcs',
      'npc-1',
      '2024-01-01T00:00:00.000Z',
    );

    expect(result).toBe('applied');
    expect(mockExecute).not.toHaveBeenCalledWith(
      'DELETE FROM npcs WHERE id = $1',
      ['npc-1'],
    );
    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq'",
    );
    const tombstoneCall = mockExecute.mock.calls.find(([sql]) =>
      (sql as string).includes('INSERT INTO _sync_changes'),
    );
    expect(tombstoneCall).toBeDefined();
    const [, tombstoneValues] = tombstoneCall as [string, unknown[]];
    expect(tombstoneValues).toContain('2024-01-01T00:00:00.000Z');
  });
});
