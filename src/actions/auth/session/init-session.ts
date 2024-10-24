import { CookieName, HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { setCookie } from '../../cookies';
import { User } from '@/types/app/user';
import { generateId, getDateFromNowInDuration } from '@/util/helper';
import { createSession } from '@/api/db/session';
import { createFingerprint } from '@/util/app';

export const initSession = async (
  user: User
): Promise<ServerActionResponse> => {
  const sessionId = generateId();
  const fingerprint = createFingerprint();

  const refreshToken = await createSession({
    fingerprint,
    sessionId,
    userId: user.id,
  });

  await setCookie(
    CookieName.SESSION,
    refreshToken,
    getDateFromNowInDuration({ hours: 6 })
  );

  return {
    status: HttpStatusCode.OK,
  };
};
