'server-only';

import { convexDb, sessions } from '../convexDb';
import { CreateSessionDto } from '@/types/api/db/session';
import { User } from '@/types/app/user';
import { getDateFromNowInDuration } from '@/util/helper';
import { generateToken } from '@/actions/token';
import { SessionTokenPayload } from '@/types/actions';

type CreateSessionData = {
  fingerprint: string;
  sessionId: string;
  userId: User['id'];
};

type SessionToken = string;

export const dbCreateSession = async (
  data: CreateSessionData
): Promise<SessionToken> => {
  const expiresAt = getDateFromNowInDuration({ days: 7 });

  const sessionToken = await generateToken<SessionTokenPayload>(
    {
      fingerprint: data.fingerprint,
      sessionId: data.sessionId,
      userId: data.userId,
    },
    expiresAt
  );

  const dto = {
    sessionToken,
    userId: data.userId,
    expiresAt: expiresAt.toISOString(),
  } satisfies CreateSessionDto;

  await convexDb.mutation(sessions.createSession, dto);

  return sessionToken;
};
