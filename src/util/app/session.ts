import { readToken } from '@/actions/token';
import { CookieName } from '@/enums';
import { SessionCookieTokenPayload } from '@/types/actions';
import { cookies } from 'next/headers';

export const getSession =
  async (): Promise<SessionCookieTokenPayload | null> => {
    const session = cookies().get(CookieName.SESSION)?.value;

    if (!session) {
      return null;
    }

    return await readToken<SessionCookieTokenPayload>(session);
  };
