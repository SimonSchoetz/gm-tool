'server-only';

import { cookies } from 'next/headers';
import { getCookieConfig } from '@/util/helper';
import { CookieName } from '@/enums';

export const setCookie = async (
  cookieName: CookieName,
  payload: string,
  expires: Date
): Promise<void> => {
  (await cookies()).set(cookieName, payload, getCookieConfig(expires));
};
