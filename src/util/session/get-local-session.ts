import { readToken } from '@/actions/token';
import { CookieName } from '@/enums';
import { LocalSessionTokenPayload } from '@/types/actions';
import { cookies } from 'next/headers';

export const getLocalSession =
  async (): Promise<LocalSessionTokenPayload | null> => {
    try {
      const session = cookies().get(CookieName.SESSION)?.value;
      return await readToken<LocalSessionTokenPayload>(session ?? '');
    } catch {
      return null;
    }
  };
