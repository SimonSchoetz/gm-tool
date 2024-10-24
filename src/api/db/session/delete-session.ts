import { convexDb, sessions } from '../convexDb';
import { DbTable, HttpStatusCode } from '@/enums';
import { Id } from '../../../../convex/_generated/dataModel';

export const dbDeleteSession = async (
  sessionId: string
): Promise<{
  status: HttpStatusCode;
}> => {
  return await convexDb.mutation(sessions.deleteSession, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
  });
};
