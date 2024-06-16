'use server';
import jwt from 'jsonwebtoken';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';

export const readToken = async (token: string): Promise<unknown> => {
  try {
    const secret = parsedEnv.JWT_AUTH_SECRET;
    assertIsString(secret);
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
