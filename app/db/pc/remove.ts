import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Pc');
  const db = await getDatabase();
  await db.execute('DELETE FROM pcs WHERE id = $1', [id]);
};
