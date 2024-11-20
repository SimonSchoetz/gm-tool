'use server';

import { TokenPayload } from '@/types/actions/token';
import { parsedEnv } from '@/util/helper';
import { jwtVerify } from 'jose';
import { JOSEError } from 'jose/errors';

export const readToken = async <T extends TokenPayload>(
  token: string,
  envKey: keyof typeof parsedEnv
): Promise<T & { expiresAt: Date; createdAt: Date }> => {
  try {
    const authSecret = parsedEnv[envKey];

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
