import { PENDING_IMAGE_IDS_SYSTEM_KEY } from '@domain';
import { getDatabase } from '../database';
import { get } from './get';
import { pendingImageIdsSchema } from './schema';

// The list is a JSON array in one `_system` row, never synced. Adding and removing are each one statement that merges with the stored list in SQL, so two image flows running at once cannot overwrite each other's ids with a list read before the other wrote.

export const getPendingImageIds = async (): Promise<string[]> => {
  const raw = await get(PENDING_IMAGE_IDS_SYSTEM_KEY);
  if (raw === null) return [];
  return pendingImageIdsSchema.parse(JSON.parse(raw));
};

export const addPendingImageIds = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const db = await getDatabase();
  await db.execute(
    `INSERT INTO _system (id, value) VALUES ($1, $2)
     ON CONFLICT(id) DO UPDATE SET value = (
       SELECT json_group_array(value) FROM (
         SELECT value FROM json_each(_system.value)
         UNION
         SELECT value FROM json_each(excluded.value)
       )
     )`,
    [PENDING_IMAGE_IDS_SYSTEM_KEY, JSON.stringify(ids)],
  );
};

export const removePendingImageIds = async (ids: string[]): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    `UPDATE _system SET value = (
       SELECT json_group_array(value) FROM json_each(_system.value)
       WHERE value NOT IN (SELECT value FROM json_each($2))
     )
     WHERE id = $1`,
    [PENDING_IMAGE_IDS_SYSTEM_KEY, JSON.stringify(ids)],
  );
};
