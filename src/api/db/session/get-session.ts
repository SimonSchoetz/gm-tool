'server-only';

import { AppSessionData, SessionDto } from '@/types/api/db';
import { convexDb, sessions, Id } from '../convexDb';
import { DbTable } from '@/enums';
import { mapToAppDto } from '../util';

export const dbGetSessionById = async (
  sessionId: AppSessionData['id']
): Promise<AppSessionData | null> => {
  const res = await convexDb.query(sessions.getSessionById, {
    sessionId: sessionId as Id<DbTable.SESSIONS>,
  });
  return res ? mapToAppDto<SessionDto>(res) : null;
};
