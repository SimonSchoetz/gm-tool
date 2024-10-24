import { CookieName, HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { setCookie } from '../../cookies';
import { User } from '@/types/app/user';
import { getDateFromNowInDuration } from '@/util/helper';
import { dbCreateSession } from '@/api/db/session';
import { createFingerprint } from '@/util/app';
import { generateToken } from '@/actions/token';
import { LocalSessionTokenPayload } from '@/types/actions';

export const initSession = async (
  user: User
): Promise<ServerActionResponse> => {
  const fingerprint = createFingerprint();

  const { sessionId } = await dbCreateSession({
    fingerprint,
    userId: user.id,
  });

  await setLocalSession(sessionId);

  return {
    status: HttpStatusCode.OK,
  };
};

export const setLocalSession = async (id: string): Promise<void> => {
  const lifeSpan = getDateFromNowInDuration({ hours: 6 });

  const localSessionToken = await generateToken<LocalSessionTokenPayload>(
    { sessionId: id },
    lifeSpan
  );

  setCookie(CookieName.SESSION, localSessionToken, lifeSpan);
};
