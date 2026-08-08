import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Encounter');
  const db = await getDatabase();
  await db.execute('DELETE FROM encounters WHERE id = $1', [id]);
};
