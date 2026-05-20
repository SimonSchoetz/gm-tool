import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Item');
  const db = await getDatabase();
  await db.execute('DELETE FROM items WHERE id = $1', [id]);
};
