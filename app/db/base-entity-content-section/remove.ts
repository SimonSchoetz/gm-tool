import { getDatabase } from '../database';
import { assertValidId } from '../util';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'Base entity content section');
  const db = await getDatabase();
  await db.execute('DELETE FROM base_entity_content_sections WHERE id = $1', [
    id,
  ]);
};
