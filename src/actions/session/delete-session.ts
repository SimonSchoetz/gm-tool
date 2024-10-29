'use server';

import { dbDeleteSession } from '@/api/db/session';
import { HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { getLocalSession } from '@/util/app';

export const deleteSession = async (): Promise<ServerActionResponse> => {
  const session = await getLocalSession();

  if (!session) {
    return { status: HttpStatusCode.NOT_FOUND };
  }

  return await dbDeleteSession(session.sessionId);
};
