import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Session Step');
  const db = await getDatabase();
  await db.execute('DELETE FROM session_steps WHERE id = $1', [id]);
};
