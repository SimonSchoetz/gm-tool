'use server';

import { generateToken } from '../token';
import { cookies } from 'next/headers';
import { currentEnv, nowInXDays } from '@/util/helper';
import { CookieName } from '@/enums';
import { SessionCookieTokenPayload } from '../../types/actions/token';
import { User } from '@/types/app/user';

export const setSessionCookie = async (user: User): Promise<void> => {
  const payload = {
    userId: user.id,
    email: user.email,
    userName: user.userName,
  };

  const expires = nowInXDays(7);

  const token = await generateToken<SessionCookieTokenPayload>(
    payload,
    expires
  );

  // Todo: Make it so Token expires after 1 week but is revived
  // as long as there is user interaction
  cookies().set(CookieName.SESSION, token, {
    httpOnly: true,
    secure: currentEnv === 'production',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    expires,
    path: '/',
  });
};
