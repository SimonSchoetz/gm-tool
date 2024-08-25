'use server';

import { TokenPayload } from '@/types/token';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { jwtVerify } from 'jose';

export const readToken = async (
  token: string
): Promise<TokenPayload & { expiresAt: Date | null }> => {
  try {
    const authSecret = parsedEnv.TOKEN_AUTH_SECRET;
    assertIsString(authSecret);

    const secret = new TextEncoder().encode(authSecret);

    const { payload } = await jwtVerify(token, secret);

    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;

    return { ...payload, expiresAt };
  } catch (error) {
    throw new Error('Invalid token');
  }
};
