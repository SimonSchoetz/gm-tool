import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Log entry');
  const db = await getDatabase();
  // The kind clause is this module's guarantee that only messages are ever deleted from an otherwise append-only log.
  await db.execute(
    "DELETE FROM encounter_log_entries WHERE id = $1 AND kind = 'message'",
    [id],
  );
};
