import {
  AppSessionData,
  DbSessionData,
  SessionDto,
} from '@/types/api/db/session';
import { cache } from 'react';
import { convexDb, sessions } from '../convexDb';
import { Id } from '../../../../convex/_generated/dataModel';
import { DbTable } from '@/enums';
import { mapToAppDto } from '../util';

export const dbGetSessionById = cache(
  async (sessionId: AppSessionData['id']): Promise<AppSessionData | null> => {
    const res = await convexDb.query(sessions.getSessionById, {
      sessionId: sessionId as Id<DbTable.SESSIONS>,
    });
    return res ? mapSessionDto(res) : null;
  }
);

const mapSessionDto = (res: DbSessionData): AppSessionData => {
  const appData = mapToAppDto<SessionDto>(res);
  return {
    ...appData,
  };
};
