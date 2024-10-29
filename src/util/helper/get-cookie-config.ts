import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { currentEnv } from './parsed-env';

export const getCookieConfig = (expires: Date): Partial<ResponseCookie> => ({
  httpOnly: true,
  secure: currentEnv === 'production',
  sameSite: 'lax',
  expires,
  path: '/',
});
