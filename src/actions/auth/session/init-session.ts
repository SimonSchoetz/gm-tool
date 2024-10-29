'use server';

import { HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { User } from '@/types/app/user';
import { dbCreateSession } from '@/api/db/session';
import { setLocalSession } from '@/util/session';

export const initSession = async (
  user: User
): Promise<ServerActionResponse> => {
  const { sessionId } = await dbCreateSession({
    userId: user.id,
  });

  await setLocalSession(sessionId, { hours: 24 });

  return {
    status: HttpStatusCode.OK,
  };
};
