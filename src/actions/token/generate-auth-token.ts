'use server';

import { TokenLifeSpan, TokenPayload } from '../../types/actions/token';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { SignJWT } from 'jose';

export const generateToken = async <T extends TokenPayload>(
  payload: T,
  lifeSpan: TokenLifeSpan,
  envKey: keyof typeof parsedEnv
): Promise<string> => {
  const authSecret = parsedEnv[envKey];
  assertIsString(authSecret);
  const secret = new TextEncoder().encode(authSecret);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(lifeSpan)
    .sign(secret);

  return token;
};
