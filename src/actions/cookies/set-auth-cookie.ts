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

  const token = await generateToken(payload, '30d');

  cookies().set(CookieName.AUTH, token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    expires: nowInXDays(30),
  });
};
