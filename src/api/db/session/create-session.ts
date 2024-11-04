'server-only';

import { convexDb, sessions } from '../convexDb';
import { User } from '@/types/app/user';
import { createSessionToken } from '@/util/session';
import { getSignature } from '../util/get-signature';

type CreateSessionData = {
  userId: User['id'];
};

export const dbCreateSession = async (
  data: CreateSessionData
): Promise<{ sessionId: string }> => {
  const dto = {
    sessionToken: await createSessionToken(data.userId, { days: 14 }),
    userId: data.userId,
    signature: await getSignature(),
  };

  const { id } = await convexDb.mutation(sessions.createSession, dto);

  return { sessionId: id };
};
