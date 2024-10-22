import { CookieName, HttpStatusCode } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { setCookie } from '../../cookies';
import { User } from '@/types/app/user';
import { headers } from 'next/headers';
import { generateId, getDateFromNowInDuration } from '@/util/helper';
import { createSession } from '@/api/db/session';

export const initSession = async (
  user: User
): Promise<ServerActionResponse> => {
  const fingerprint =
    headers().get('user-agent')?.split(' ')[1] ?? 'No fingerprint';
  const sessionId = generateId();

  const res = await createSession({
    fingerprint,
    sessionId,
    userId: user.id,
  });

  await setCookie(
    CookieName.SESSION,
    res,
    getDateFromNowInDuration({ hours: 6 })
  );

  return {
    status: HttpStatusCode.OK,
  };
};
