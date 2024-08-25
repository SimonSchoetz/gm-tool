'use server';

import { cookies } from 'next/headers';
import { CookieName } from '@/enums';

export const deleteCookie = (cookieName: CookieName): void => {
  cookies().delete(cookieName);
};
