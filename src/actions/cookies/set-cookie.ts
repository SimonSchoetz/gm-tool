'use server';

import { cookies } from 'next/headers';
import { currentEnv } from '@/util/helper';
import { CookieName } from '@/enums';

export const setCookie = async (
  cookieName: CookieName,
  payload: string,
  expires: Date
): Promise<void> => {
  cookies().set(cookieName, payload, {
    httpOnly: true,
    secure: currentEnv === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
};
