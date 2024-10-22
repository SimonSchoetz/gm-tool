import { convexDb, sessions } from '../convexDb';
import { CreateSessionDto } from '@/types/api/db/session';
import { User } from '@/types/app/user';
import { getDateFromNowInDuration } from '@/util/helper';
import { generateToken } from '@/actions/token';

type CreateSessionData = {
  fingerprint: string;
  sessionId: string;
  userId: User['id'];
};

export const createSession = async (
  data: CreateSessionData
): Promise<string> => {
  const expiresAt = getDateFromNowInDuration({ days: 7 });

  const refreshToken = await generateToken(
    {
      fingerprint: data.fingerprint,
      sessionId: data.sessionId,
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
