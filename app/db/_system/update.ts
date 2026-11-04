import { getDatabase } from '../database';

export const update = async (
  // eslint-disable-next-line local/no-constant-argument -- the raw write of the `_system` key-value table, which app/db/CLAUDE.md — Structure keeps apart from the per-key accessors; device.ts, the only one today, always passes DEVICE_SYSTEM_KEY
  key: string,
  value: string | null,
): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
    [key, value],
  );
};
