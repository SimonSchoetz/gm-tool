// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getChangesSince', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the changes after the given seq in ascending order, at most the limit, and none at or before the seq', async () => {
    const { create } = await import('@db/adventure');
    const { getChangesSince } = await import('../get-changes-since');
    const { getMaxSeq } = await import('../get-max-seq');
    await create();
    const secondId = await create();
    const thirdId = await create();
    await create();
    const seqBeforeSecond = (await getMaxSeq()) - 3;

    const changes = await getChangesSince(seqBeforeSecond, 2);

    expect(changes.map((change) => change.row_id)).toEqual([secondId, thirdId]);
    expect(changes.map((change) => change.seq)).toEqual([
      seqBeforeSecond + 1,
      seqBeforeSecond + 2,
    ]);
  });

  it('rejects with a SyncChangeRecordError when any selected row, not only the first, fails the record schema', async () => {
    const { create } = await import('@db/adventure');
    const { getChangesSince } = await import('../get-changes-since');
    const { getMaxSeq } = await import('../get-max-seq');
    const { getDatabase } = await import('@db/database');
    await create();
    const seqAfterValidChange = await getMaxSeq();
    const db = await getDatabase();
    // A non-numeric text keeps its TEXT storage class in the INTEGER-affinity `deleted` column, so the row reads back with `deleted: 'yes'`.
    await db.execute(
      "INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) VALUES ('adventures:malformed', 'adventures', 'malformed', $1, 'yes', NULL)",
      [seqAfterValidChange + 1],
    );

    await expect(
      getChangesSince(seqAfterValidChange - 1, 10),
    ).rejects.toMatchObject({ name: 'SyncChangeRecordError' });
  });
});
