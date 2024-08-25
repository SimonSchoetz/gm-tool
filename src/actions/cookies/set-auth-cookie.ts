'use server';

import { User } from '@/types/user';
import { generateToken } from '../token';
import { cookies } from 'next/headers';
import { nowInXDays } from '@/util/helper';
import { CookieName } from '@/enums';
import { AuthCookiePayload } from '@/types/cookies';

export const setAuthCookie = async ({
  email,
  userContentId,
}: User): Promise<void> => {
  const payload: AuthCookiePayload = {
    email,
    userContentId,
  };

  const expires = nowInXDays(7);

  const token = await generateToken(payload, expires);

  // Todo: Make it so Token expires after 1 week but is revived
  // as long as there is user interaction
  cookies().set(CookieName.AUTH, token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    expires,
  });
};
