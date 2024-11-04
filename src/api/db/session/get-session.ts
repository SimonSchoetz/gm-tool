'server-only';

import { AppSessionData, SessionDto } from '@/types/api/db';
import { convexDb, sessions, Id } from '../convexDb';
import { DbTable } from '@/enums';
import { mapToAppDto } from '../util';
import { getSignature } from '../util/get-signature';

export const dbGetSessionById = async (
  sessionId: AppSessionData['id']
): Promise<AppSessionData | null> => {
  const res = await convexDb.query(sessions.getSessionById, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
    signature: await getSignature(),
  });
  return res ? mapToAppDto<SessionDto>(res) : null;
};
