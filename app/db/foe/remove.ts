import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Foe');
  const db = await getDatabase();
  await db.execute('DELETE FROM foes WHERE id = $1', [id]);
};
