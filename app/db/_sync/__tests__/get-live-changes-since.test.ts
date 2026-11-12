// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getLiveChangesSince', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns only the listed rows of the given table whose latest change is after the seq and not a deletion', async () => {
    const adventureDb = await import('@db/adventure');
    const sessionDb = await import('@db/session');
    const { getLiveChangesSince } = await import('../get-live-changes-since');
    const { getMaxSeq } = await import('../get-max-seq');
    const unchangedId = await adventureDb.create();
    const editedId = await adventureDb.create();
    const sinceSeq = await getMaxSeq();
    const createdId = await adventureDb.create();
    // Changed after the seq, but not listed.
    await adventureDb.create();
    const deletedId = await adventureDb.create();
    await adventureDb.remove(deletedId);
    const sessionId = await sessionDb.create(createdId);
    await adventureDb.update(editedId, { name: 'Edited' });

    const changes = await getLiveChangesSince(sinceSeq, 'adventures', [
      unchangedId,
      editedId,
      createdId,
      deletedId,
      sessionId,
    ]);

    expect(changes.map((change) => change.row_id).sort()).toEqual(
      [createdId, editedId].sort(),
    );
  });

  it('returns the change of a listed session when asked for sessions', async () => {
    const adventureDb = await import('@db/adventure');
    const sessionDb = await import('@db/session');
    const { getLiveChangesSince } = await import('../get-live-changes-since');
    const adventureId = await adventureDb.create();
    const sessionId = await sessionDb.create(adventureId);

    const changes = await getLiveChangesSince(0, 'sessions', [
      adventureId,
      sessionId,
    ]);

    expect(changes.map((change) => change.row_id)).toEqual([sessionId]);
  });

  it('rejects with a SyncChangeRecordError when a selected row fails the record schema', async () => {
    const { getLiveChangesSince } = await import('../get-live-changes-since');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    // A non-numeric text keeps its TEXT storage class in the INTEGER-affinity `seq` column, so the row reads back with `seq: 'late'`, which still compares greater than any number.
    await db.execute(
      "INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) VALUES ('adventures:malformed', 'adventures', 'malformed', 'late', 0, NULL)",
    );

    await expect(
      getLiveChangesSince(0, 'adventures', ['malformed']),
    ).rejects.toMatchObject({ name: 'SyncChangeRecordError' });
  });
});
