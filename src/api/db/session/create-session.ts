'server-only';

import { convexDb, sessions } from '../convexDb';
import { CreateSessionDto } from '@/types/api/db/session';
import { User } from '@/types/app/user';
import { getDateFromNowInDuration } from '@/util/helper';
import { generateToken } from '@/actions/token';
import { RefreshTokenPayload } from '@/types/actions';

type CreateSessionData = {
  fingerprint: string;
  sessionId: string;
  userId: User['id'];
};

type RefreshToken = string;

export const dbCreateSession = async (
  data: CreateSessionData
): Promise<RefreshToken> => {
  const expiresAt = getDateFromNowInDuration({ days: 7 });

  const refreshToken = await generateToken<RefreshTokenPayload>(
    {
      fingerprint: data.fingerprint,
      sessionId: data.sessionId,
      userId: data.userId,
    },
    expiresAt
  );

  const dto = {
    refreshToken,
    userId: data.userId,
    expiresAt: expiresAt.toISOString(),
  } satisfies CreateSessionDto;

  await convexDb.mutation(sessions.createSession, dto);

  return refreshToken;
};
