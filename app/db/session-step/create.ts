import { getDatabase } from '../database';
import { generateId } from '../../util';
import { sessionStepTable } from './schema';
import type { CreateSessionStepInput } from './types';

export const create = async (data: CreateSessionStepInput): Promise<string> => {
  const validated = sessionStepTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();

  const columns: string[] = ['id', 'session_id', 'sort_order', 'checked'];
  const values: (string | number | null)[] = [
    id,
    validated.session_id,
    validated.sort_order,
    validated.checked,
  ];

  if (validated.name !== undefined) {
    columns.push('name');
    values.push(validated.name);
  }
  if (validated.content !== undefined) {
    columns.push('content');
    values.push(validated.content);
  }
  if (validated.default_step_key !== undefined) {
    columns.push('default_step_key');
    values.push(validated.default_step_key);
  }

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  await db.execute(
    `INSERT INTO session_steps (${columns.join(', ')}) VALUES (${placeholders})`,
    values,
  );
  return id;
};
