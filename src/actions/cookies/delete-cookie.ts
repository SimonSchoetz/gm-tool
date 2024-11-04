'server-only';

import { cookies } from 'next/headers';
import { CookieName } from '@/enums';

export const deleteCookie = async (cookieName: CookieName): Promise<void> => {
  (await cookies()).delete(cookieName);
};
