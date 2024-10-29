'server-only';

import { convexDb, sessions, Id } from '../convexDb';
import { DbTable, HttpStatusCode } from '@/enums';

export const dbDeleteSession = async (
  sessionId: string
): Promise<{
  status: HttpStatusCode;
}> => {
  return await convexDb.mutation(sessions.deleteSession, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
  });
};
