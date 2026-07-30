import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { getAllBySession } from './get-all-by-session';

export const duplicateBySession = async (
  sourceSessionId: string,
  targetSessionId: string,
): Promise<void> => {
  assertValidId(sourceSessionId, 'Session');
  assertValidId(targetSessionId, 'Session');

  const sourceSteps = await getAllBySession(sourceSessionId);
  if (sourceSteps.length === 0) return;

  const db = await getDatabase();

  for (const step of sourceSteps) {
    // name and sort_order are copied rather than reset or re-derived from array position, so each duplicate keeps its own label and the source's exact ordering values.
    const {
      id: _sourceRowId,
      session_id: _sourceSessionId,
      created_at: _sourceCreatedAt,
      updated_at: _sourceUpdatedAt,
      ...copiedColumns
    } = step;

    const { sql, values } = buildDuplicateQuery(
      'session_steps',
      generateId(),
      copiedColumns,
      { session_id: targetSessionId },
    );

    await db.execute(sql, values);
  }
};
