import { CookieName, HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { setCookie } from '../../cookies';
import { User } from '@/types/app/user';
import { generateId, getDateFromNowInDuration } from '@/util/helper';
import { dbCreateSession } from '@/api/db/session';
import { createFingerprint } from '@/util/app';

export const initSession = async (
  user: User
): Promise<ServerActionResponse> => {
  // get sessions and clean up

  const sessionId = generateId();
  const fingerprint = createFingerprint();

  const sessionToken = await dbCreateSession({
    fingerprint,
    sessionId,
    userId: user.id,
  });

  await setLocalSession(sessionToken);

  return {
    status: HttpStatusCode.OK,
  };
};

export const setLocalSession = async (sessionToken: string): Promise<void> => {
  setCookie(
    CookieName.SESSION,
    sessionToken,
    getDateFromNowInDuration({ hours: 6 })
  );
};
