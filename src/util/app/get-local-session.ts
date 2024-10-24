import { readToken } from '@/actions/token';
import { CookieName } from '@/enums';
import { SessionTokenPayload } from '@/types/actions';
import { cookies } from 'next/headers';

export const getLocalSession =
  async (): Promise<SessionTokenPayload | null> => {
    const session = cookies().get(CookieName.SESSION)?.value;
    if (!session) return null;

    try {
      return await readToken<SessionTokenPayload>(session);
    } catch {
      return null;
    }
  };
