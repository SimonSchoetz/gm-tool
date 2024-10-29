'use server';

import { TokenPayload } from '../../types/actions/token';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { jwtVerify } from 'jose';
import { JOSEError } from 'jose/errors';

export const readToken = async <T extends TokenPayload>(
  token: string
): Promise<T & { expiresAt: Date; createdAt: Date }> => {
  try {
    const authSecret = parsedEnv.TOKEN_AUTH_SECRET;
    assertIsString(authSecret);

    const secret = new TextEncoder().encode(authSecret);

    const { payload } = await jwtVerify(token, secret);

    const createdAt = new Date(payload.iat! * 1000);
    const expiresAt = new Date(payload.exp! * 1000);

    return { ...(payload as T), expiresAt, createdAt };
  } catch (error) {
    if (error instanceof JOSEError) {
      const isExpired = error.code === 'ERR_JWT_EXPIRED';
      if (isExpired) {
        throw new Error('Token expired');
      }
    }
    throw error;
  }
};
