import { readToken } from '@/actions/token';
import { CookieName } from '@/enums';
import { LocalSessionTokenPayload } from '@/types/actions';
import { cookies } from 'next/headers';

export const getLocalSession =
  async (): Promise<LocalSessionTokenPayload | null> => {
    try {
      const session = (await cookies()).get(CookieName.AUTH_SESSION)?.value;
      return await readToken<LocalSessionTokenPayload>(
        session ?? '',
        'AUTH_TOKEN_SECRET'
      );
    } catch {
      return null;
    }
  };
