// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const PEER = 'a'.repeat(64);
const OTHER_PEER = 'b'.repeat(64);

describe('peer state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('starts an unknown peer at watermark 0 and follows each new watermark that is set', async () => {
    const { getPeerWatermark, setPeerWatermark } =
      await import('../peer-state');

    expect(await getPeerWatermark(PEER)).toBe(0);
    await setPeerWatermark(PEER, 5);
    expect(await getPeerWatermark(PEER)).toBe(5);
    await setPeerWatermark(PEER, 9);
    expect(await getPeerWatermark(PEER)).toBe(9);
  });

  it('resets a removed peer to watermark 0 and leaves other peers alone', async () => {
    const { getPeerWatermark, setPeerWatermark, removePeerState } =
      await import('../peer-state');
    await setPeerWatermark(PEER, 5);
    await setPeerWatermark(OTHER_PEER, 7);

    await removePeerState(PEER);

    expect(await getPeerWatermark(PEER)).toBe(0);
    expect(await getPeerWatermark(OTHER_PEER)).toBe(7);
  });

  it('rejects a peer id that is not hex from each function and writes nothing', async () => {
    const { getPeerWatermark, setPeerWatermark, removePeerState } =
      await import('../peer-state');
    const { getDatabase } = await import('@db/database');
    await setPeerWatermark(PEER, 3);

    await expect(getPeerWatermark('not-hex')).rejects.toThrow();
    await expect(setPeerWatermark('not-hex', 1)).rejects.toThrow();
    await expect(removePeerState('not-hex')).rejects.toThrow();

    const db = await getDatabase();
    expect(
      await db.select<unknown[]>(
        'SELECT id, last_received_seq FROM _sync_peers',
      ),
    ).toEqual([{ id: PEER, last_received_seq: 3 }]);
  });
});
