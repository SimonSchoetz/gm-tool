import { ENDPOINT_ID_HEX_REGEX } from '@domain';
import { getDatabase } from '../database';

const assertValidPeerId = (peerId: string): void => {
  if (!ENDPOINT_ID_HEX_REGEX.test(peerId)) {
    throw new Error(`Valid peer ID is required: ${peerId}`);
  }
};

export const getPeerWatermark = async (peerId: string): Promise<number> => {
  assertValidPeerId(peerId);
  const db = await getDatabase();
  const rows = await db.select<{ last_received_seq: number }[]>(
    'SELECT last_received_seq FROM _sync_peers WHERE id = $1',
    [peerId],
  );
  return rows[0]?.last_received_seq ?? 0;
};

export const setPeerWatermark = async (
  peerId: string,
  seq: number,
): Promise<void> => {
  assertValidPeerId(peerId);
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO _sync_peers (id, last_received_seq) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET last_received_seq = excluded.last_received_seq',
    [peerId, seq],
  );
};

export const removePeerState = async (peerId: string): Promise<void> => {
  assertValidPeerId(peerId);
  const db = await getDatabase();
  await db.execute('DELETE FROM _sync_peers WHERE id = $1', [peerId]);
};
