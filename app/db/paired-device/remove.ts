import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'paired device');
  const db = await getDatabase();
  await db.execute('DELETE FROM paired_devices WHERE id = $1', [id]);
};
