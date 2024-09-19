'use server';

import { generateToken } from '../token';
import { cookies } from 'next/headers';
import { nowInXDays } from '@/util/helper';
import { CookieName } from '@/enums';
import { AuthCookieTokenPayload } from '../../types/actions/token';
import { User } from '@/types/app/user';

export const setAuthCookie = async ({ id }: User): Promise<void> => {
  const payload = {
    userId: id,
  };

  const expires = nowInXDays(7);

  const token = await generateToken<AuthCookieTokenPayload>(payload, expires);

  // Todo: Make it so Token expires after 1 week but is revived
  // as long as there is user interaction
  cookies().set(CookieName.AUTH, token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    expires,
  });
};
