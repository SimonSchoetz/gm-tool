import { getDatabase } from '../database';

// eslint-disable-next-line local/no-constant-argument -- the raw read of the `_system` key-value table, which app/db/CLAUDE.md — Structure keeps apart from the per-key accessors; device.ts, the only one today, always passes DEVICE_SYSTEM_KEY
export const get = async (key: string): Promise<string | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string | null }[]>(
    'SELECT value FROM _system WHERE id = $1',
    [key],
  );
  return rows[0]?.value ?? null;
};
