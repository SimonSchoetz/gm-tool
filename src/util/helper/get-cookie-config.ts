import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { currentEnv } from './parsed-env';

export const getCookieConfig = (
  expires: Date | null
): Partial<ResponseCookie> => {
  const config: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: currentEnv === 'production',
    sameSite: 'lax',
    path: '/',
  };

  if (expires) {
    config.expires = expires;
  }
  return config;
};
