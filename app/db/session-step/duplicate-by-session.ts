import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { getAllBySession } from './get-all-by-session';

export const duplicateBySession = async (
  sourceSessionId: string,
  targetSessionId: string,
): Promise<void> => {
  assertValidId(sourceSessionId, 'Session');
  assertValidId(targetSessionId, 'Session');

  const sourceSteps = await getAllBySession(sourceSessionId);
  if (sourceSteps.length === 0) return;

  const { created_at, updated_at } = generateDbTimestamps();
  const db = await getDatabase();

  for (const step of sourceSteps) {
    // sort_order is copied rather than re-derived from array position so the duplicate preserves the source's exact ordering values.
    const { sql, values } = buildCreateQuery<{
      session_id: string;
      name: string | null;
      content: string | null;
      default_step_key: string | null;
      checked: number;
      sort_order: number;
      created_at: string;
      updated_at: string;
    }>('session_steps', generateId(), {
      session_id: targetSessionId,
      name: step.name ?? null,
      content: step.content ?? null,
      default_step_key: step.default_step_key ?? null,
      checked: step.checked,
      sort_order: step.sort_order,
      created_at,
      updated_at,
    });

    await db.execute(sql, values);
  }
};
