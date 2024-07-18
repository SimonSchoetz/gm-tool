'use server';

import { User } from '@/types/user';
import { generateToken } from '../token';
import { cookies } from 'next/headers';
import { nowInXDays } from '@/util/helper';

export const setAuthCookie = async ({
  email,
  userContentId,
}: User): Promise<void> => {
  const token = await generateToken({ email, userContentId }, '30d');

  cookies().set('auth', token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    expires: nowInXDays(30),
  });
};
