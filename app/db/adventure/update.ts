import { getDatabase } from '../database';
import { adventureTable } from './schema';
import type { UpdateAdventureInput } from './types';

export const update = async (
  id: string,
  data: UpdateAdventureInput
): Promise<void> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid adventure ID is required');
  }

  const validated = adventureTable.updateSchema.parse(data);

  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (validated.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(validated.title);
  }
  if (validated.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(validated.description);
  }
  if (validated.image_id !== undefined) {
    fields.push(`image_id = $${paramIndex++}`);
    values.push(validated.image_id);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.execute(
    `UPDATE adventures SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
};
