import { getDatabase } from '../database';
import { updateSessionSchema } from './schema';
import type { UpdateSessionInput } from './types';

export const update = async (
  id: string,
  data: UpdateSessionInput
): Promise<void> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid session ID is required');
  }

  const validated = updateSessionSchema.parse(data);

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
  if (validated.session_date !== undefined) {
    fields.push(`session_date = $${paramIndex++}`);
    values.push(validated.session_date);
  }
  if (validated.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(validated.notes);
  }
  if (validated.adventure_id !== undefined) {
    fields.push(`adventure_id = $${paramIndex++}`);
    values.push(validated.adventure_id);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.execute(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
};
