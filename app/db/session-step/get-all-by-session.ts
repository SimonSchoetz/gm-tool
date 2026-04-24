import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { SessionStep } from './types';

export const getAllBySession = async (
  sessionId: string,
): Promise<SessionStep[]> => {
  assertValidId(sessionId, 'Session');
  const db = await getDatabase();
  return db.select<SessionStep[]>(
    'SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order ASC',
    [sessionId],
  );
};
