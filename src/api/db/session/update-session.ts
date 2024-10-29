import 'server-only';

import { DbTable, HttpStatusCode } from '@/enums';
import { convexDb, sessions, Id } from '../convexDb';
import { SessionDto } from '@/types/api/db';

export const dbUpdateSession = async (
  sessionId: string,
  sessionData: Partial<SessionDto>
): Promise<{ status: HttpStatusCode }> => {
  return await convexDb.mutation(sessions.updateSession, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
    sessionData,
  });
};
