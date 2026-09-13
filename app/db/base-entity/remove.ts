import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Base entity');
  const db = await getDatabase();
  await db.execute('DELETE FROM base_entities WHERE id = $1', [id]);
};
