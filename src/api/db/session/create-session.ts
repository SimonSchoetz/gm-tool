'server-only';

import { convexDb, sessions } from '../convexDb';
import { CreateSessionDto } from '@/types/api/db/session';
import { User } from '@/types/app/user';
import { getDateFromNowInDuration } from '@/util/helper';
import { generateToken } from '@/actions/token';
import { LocalSessionTokenPayload, SessionTokenPayload } from '@/types/actions';

type CreateSessionData = {
  fingerprint: string;

  userId: User['id'];
};

type SessionID = string;

export const dbCreateSession = async (
  data: CreateSessionData
): Promise<{ sessionId: SessionID }> => {
  const expiresAt = getDateFromNowInDuration({ days: 7 });

  const sessionToken = await generateToken<SessionTokenPayload>(
    {
      fingerprint: data.fingerprint,
      userId: data.userId,
    },
    expiresAt
  );

  const dto = {
    sessionToken,
    userId: data.userId,
    expiresAt: expiresAt.toISOString(),
  } satisfies CreateSessionDto;

  const { id } = await convexDb.mutation(sessions.createSession, dto);

  return { sessionId: id };
};
