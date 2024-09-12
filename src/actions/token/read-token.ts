'use server';

import { TokenPayload } from '@/types/token';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { jwtVerify } from 'jose';
import { JOSEError } from 'jose/errors';

export const readToken = async <T extends TokenPayload>(
  token: string
): Promise<T & { expiresAt: Date | null | 'expired' }> => {
  try {
    const authSecret = parsedEnv.TOKEN_AUTH_SECRET;
    assertIsString(authSecret);

    const secret = new TextEncoder().encode(authSecret);

    const { payload } = await jwtVerify(token, secret);

    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;

    return { ...(payload as T), expiresAt };
  } catch (error) {
    if (error instanceof JOSEError) {
      const errorMessage =
        error.code === 'ERR_JWT_EXPIRED' ? 'expired' : error.code;
      throw new Error(`Invalid token: ${errorMessage}`);
    }
    throw new Error('Invalid token');
  }
};
