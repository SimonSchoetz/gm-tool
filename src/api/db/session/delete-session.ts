'server-only';

import { convexDb, sessions, Id } from '../convexDb';
import { DbTable, HttpStatusCode } from '@/enums';
import { getSignature } from '../util/get-signature';

export const dbDeleteSession = async (
  sessionId: string
): Promise<{
  status: HttpStatusCode;
}> => {
  return await convexDb.mutation(sessions.deleteSession, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
    signature: await getSignature(),
  });
};
