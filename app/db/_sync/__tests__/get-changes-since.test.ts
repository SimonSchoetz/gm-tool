import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SyncChangeRecord } from '../schema';

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

import { getChangesSince } from '../get-changes-since';

describe('getChangesSince', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should query with seq filter, order, and limit', async () => {
    await getChangesSince(10, 200);

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT table_name, row_id, seq, deleted, deleted_at FROM _sync_changes WHERE seq > $1 ORDER BY seq ASC LIMIT $2',
      [10, 200],
    );
  });

  it('should return the mocked rows', async () => {
    const rows: SyncChangeRecord[] = [
      {
        table_name: 'npcs',
        row_id: 'npc-1',
        seq: 11,
        deleted: 0,
        deleted_at: null,
      },
    ];
    mockSelect.mockResolvedValue(rows);

    const result = await getChangesSince(10, 200);

    expect(result).toEqual(rows);
  });
});
